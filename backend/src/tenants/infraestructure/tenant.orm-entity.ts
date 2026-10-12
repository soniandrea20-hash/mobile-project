import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({name: 'tenants'})
export class TenantOrmEntity {
    @PrimaryGeneratedColumn('uuid', {name: 'tenant_id'})
    tenant_id: string;

    @Column({type: 'varchar', length: 320, unique:true})
    name:string;

    @Column({type: 'boolean', default:true, name:'is_active'})
    is_active:boolean;
}