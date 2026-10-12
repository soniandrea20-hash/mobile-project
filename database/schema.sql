/* Schema para EduKit */

create table if not exists users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

create table if not exists roles (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

create table if not exists users_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,

    PRIMARY KEY (user_id, role_id),

    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

create table if not exists tenants (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

create table if not exists stores (
    store_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

create table if not exists users_tenants (
    user_id UUID NOT NULL REFERENCES users(user_id),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    role_id UUID NOT NULL REFERENCES roles(role_id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (user_id, tenant_id, role_id)
);

create table if not exists users_stores (
    user_id UUID NOT NULL REFERENCES users(user_id),
    store_id UUID NOT NULL REFERENCES stores(store_id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (user_id, store_id)
);