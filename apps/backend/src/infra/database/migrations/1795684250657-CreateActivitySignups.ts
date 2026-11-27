import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActivitySignups1795684250657 implements MigrationInterface {
  name = 'CreateActivitySignups1795684250657';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE activity_signups (
        id CHAR(36) NOT NULL,
        activity_id BIGINT UNSIGNED NOT NULL,
        name VARCHAR(50) NOT NULL,
        phone VARCHAR(16) NOT NULL,
        inviter_id CHAR(36) NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE INDEX uq_activity_signups_activity_phone (activity_id, phone),
        INDEX idx_activity_signups_activity_inviter (activity_id, inviter_id),
        INDEX idx_activity_signups_inviter_id (inviter_id),
        CONSTRAINT fk_activity_signups_activity_id
          FOREIGN KEY (activity_id) REFERENCES activities (id) ON DELETE RESTRICT,
        CONSTRAINT fk_activity_signups_inviter_id
          FOREIGN KEY (inviter_id) REFERENCES activity_signups (id) ON DELETE RESTRICT
      ) ENGINE = InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE activity_signups');
  }
}
