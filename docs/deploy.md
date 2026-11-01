# Despliegue del backend en Azure

El backend (`backend/`) se despliega como contenedor en Azure Container Apps desde GitHub Actions (`.github/workflows/backend-deploy.yml`): en cada PR que toca `backend/` corre `tsc` y Jest; en cada push a `main` además construye la imagen en ACR y actualiza la Container App. La imagen (`backend/Dockerfile`) incluye `ffprobe` (paquete `ffmpeg`), que el backend usa para medir la duración de los videos.

Configuración única, hecha una vez a mano. Los nombres son ejemplos; los flags de `az` conviene validarlos con `az <comando> --help` porque la CLI cambia entre versiones.

```bash
RG=mostrador-rg; LOC=brazilsouth
ACR=mostradoracr            # único globalmente, solo minúsculas y números
APP=mostrador-backend; ENV=mostrador-env
PG=mostrador-pg; STORAGE=mostradormedia   # únicos globalmente
az group create -n $RG -l $LOC
```

## 1. Registro de imágenes (ACR)

```bash
az acr create -g $RG -n $ACR --sku Basic
```

## 2. PostgreSQL Flexible Server

```bash
az postgres flexible-server create -g $RG -n $PG -l $LOC \
  --admin-user mostrador --admin-password '<clave-fuerte>' \
  --tier Burstable --sku-name Standard_B1ms \
  --database-name mobile_project \
  --public-access 0.0.0.0     # regla "permitir servicios de Azure"
```

- `--public-access 0.0.0.0` habilita solo servicios de Azure (la Container App); para correr `db:apply` desde tu máquina agregá tu IP con `az postgres flexible-server firewall-rule create -g $RG -n $PG --rule-name mi-ip --start-ip-address <ip> --end-ip-address <ip>`.
- El servidor exige TLS. El backend no configura SSL en TypeORM; se activa con la variable `PGSSLMODE=require` (la lee `pg`, tanto en la app como en `db:apply`).
- Host: `$PG.postgres.database.azure.com`.

## 3. Storage Account (media)

```bash
az storage account create -g $RG -n $STORAGE -l $LOC --sku Standard_LRS \
  --allow-blob-public-access true
az storage container create --account-name $STORAGE -n media \
  --public-access blob --auth-mode login
az storage account show-connection-string -g $RG -n $STORAGE -o tsv   # AZURE_STORAGE_CONNECTION_STRING
```

El acceso público de lectura a nivel `blob` es necesario porque `/media/*` redirige (302) a la URL pública del blob. Si la creación del contenedor falla por permisos, asignate `Storage Blob Data Contributor` o usá `--account-key`.

## 4. Container Apps

```bash
az containerapp env create -g $RG -n $ENV -l $LOC

# Primer despliegue con una imagen pública de relleno; el pipeline la reemplaza.
az containerapp create -g $RG -n $APP --environment $ENV \
  --image mcr.microsoft.com/k8se/quickstart:latest \
  --ingress external --target-port 3000 \
  --min-replicas 1 --max-replicas 2 \
  --system-assigned

# La identidad de la app puede bajar imágenes de ACR (sin contraseñas)
PRINCIPAL=$(az containerapp show -g $RG -n $APP --query identity.principalId -o tsv)
az role assignment create --assignee $PRINCIPAL --role AcrPull \
  --scope $(az acr show -n $ACR --query id -o tsv)
az containerapp registry set -g $RG -n $APP \
  --server $ACR.azurecr.io --identity system
```

Secretos y variables (nada de esto va en el workflow):

```bash
az containerapp secret set -g $RG -n $APP --secrets \
  db-password='<clave-fuerte>' \
  jwt-secret='<secreto-largo>' \
  storage-conn='<connection-string>'

az containerapp update -g $RG -n $APP --set-env-vars \
  DB_HOST=$PG.postgres.database.azure.com DB_PORT=5432 \
  DB_USERNAME=mostrador DB_NAME=mobile_project PGSSLMODE=require \
  DB_PASSWORD=secretref:db-password \
  JWT_SECRET=secretref:jwt-secret JWT_EXPIRE_SECONDS=600 \
  BASE_DOMAIN=mostrador.io \
  WEB_ORIGIN_TEMPLATE='https://{slug}.mostrador.io' \
  AZURE_STORAGE_CONNECTION_STRING=secretref:storage-conn \
  AZURE_STORAGE_CONTAINER=media
```

`PORT` no se define: el backend usa 3000, igual que `--target-port`. Opcional: `MEDIA_PUBLIC_BASE_URL` si los medios se sirven por un CDN.

## 5. Base de datos

Los scripts de `database/scripts/*.sql` son idempotentes y se aplican con `db:apply` (lleva el registro en `schema_versions`). Desde `backend/`, con un `.env` apuntando a Azure (y `PGSSLMODE=require`) y tu IP en el firewall:

```bash
npm run db:apply
```

El pipeline no aplica scripts; se corre a mano antes de desplegar una versión que los cambie.

## 6. GitHub Actions con OIDC (sin secretos de larga vida)

```bash
APP_ID=$(az ad app create --display-name mostrador-github --query appId -o tsv)
az ad sp create --id $APP_ID
az ad app federated-credential create --id $APP_ID --parameters '{
  "name": "github-production",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:universidad-de-pilar/mobile-project:environment:production",
  "audiences": ["api://AzureADTokenExchange"]
}'
az role assignment create --assignee $APP_ID --role Contributor \
  --scope $(az group show -n $RG --query id -o tsv)
az role assignment create --assignee $APP_ID --role AcrPush \
  --scope $(az acr show -n $ACR --query id -o tsv)
```

`Contributor` sobre el grupo de recursos es lo más simple; se puede acotar con un rol propio si se necesita.

En GitHub, crear el environment `production` (se puede agregar aprobación manual) y cargar:

| Tipo | Nombre | Valor |
| --- | --- | --- |
| Secret | `AZURE_CLIENT_ID` | `$APP_ID` |
| Secret | `AZURE_TENANT_ID` | `az account show --query tenantId -o tsv` |
| Secret | `AZURE_SUBSCRIPTION_ID` | `az account show --query id -o tsv` |
| Variable | `ACR_NAME` | `$ACR` |
| Variable | `CONTAINER_APP_NAME` | `$APP` |
| Variable | `RESOURCE_GROUP` | `$RG` |

El deploy usa `az acr build` (la imagen se construye en ACR, no hace falta Docker en el runner) y `az containerapp update --image` con el SHA del commit como tag.

## Brechas conocidas

- **Subdominios por tenant.** El backend resuelve el tenant por `{slug}.BASE_DOMAIN`. Container Apps necesita un dominio personalizado wildcard (`*.mostrador.io`) con certificado propio (bring-your-own, PFX): los certificados administrados de Azure no cubren wildcards. Hasta tenerlo, se puede probar con el header `X-Tenant-Slug` sobre el FQDN que asigna Azure. El CORS de `main.ts` ya acepta `https://*.mostrador.io`.
- **App móvil (Expo)** y web de autopedido: no se despliegan con este pipeline.
- **Migraciones de base de datos**: manuales (sección 5).
- **Backups y escalado** de PostgreSQL: valores por defecto del tier Burstable.
