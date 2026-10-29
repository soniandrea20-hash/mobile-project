/* Administrador de la plataforma (#76): el primer usuario que se registra en admin.<dominio> recibe el rol root. Ver docs/api.md secciones 2 y 12 */

-- tenants

alter table tenants add column if not exists created_at timestamptz not null default current_timestamp;

comment on column tenants.created_at is 'Orden estable del listado de tenants del administrador de la plataforma';

-- permisos de administracion de tenants; root recibe todos los permisos para que /me refleje que administra todo

insert into permissions (code, description) values
    ('tenants:read', 'Ver tenants'),
    ('tenants:create', 'Crear tenants con su primer local y su dueno'),
    ('tenants:update', 'Editar o suspender tenants')
on conflict (code) do nothing;

insert into roles_permissions (role_id, permission_id)
select r.role_id, p.permission_id
from roles r
cross join permissions p
where r.name = 'root'
on conflict do nothing;

/*
La unicidad del root no usa indice: la garantiza la aplicacion con pg_advisory_xact_lock en la transaccion
del primer registro (UsersRepository.createRoot). Un indice parcial no puede filtrar por el nombre del rol,
que vive en otra tabla.
*/
