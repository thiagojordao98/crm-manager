import { Injectable, Inject } from '@nestjs/common';
import { eq, and, isNull, lt } from 'drizzle-orm';
import * as schema from '../../../../database/drizzle/schemas';
import { DATABASE_CONNECTION } from '../../../../database/database.module';
import { Invitation } from '../../domain/entities/invitation.entity';
import { IInvitationRepository } from '../../domain/repositories/invitation-repository.interface';

@Injectable()
export class InvitationRepository implements IInvitationRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: any,
  ) {}

  async findByToken(token: string): Promise<Invitation | null> {
    const result = await this.db
      .select()
      .from(schema.invitations)
      .where(eq(schema.invitations.token, token))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByEmail(email: string, organizationId: string): Promise<Invitation | null> {
    const result = await this.db
      .select()
      .from(schema.invitations)
      .where(
        and(
          eq(schema.invitations.email, email),
          eq(schema.invitations.organizationId, organizationId),
          isNull(schema.invitations.acceptedAt),
        ),
      )
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findPendingByOrganizationId(organizationId: string): Promise<Invitation[]> {
    const results = await this.db
      .select()
      .from(schema.invitations)
      .where(
        and(
          eq(schema.invitations.organizationId, organizationId),
          isNull(schema.invitations.acceptedAt),
        ),
      );

    return results.map((row: any) => this.mapToEntity(row));
  }

  async create(invitation: Omit<Invitation, 'id' | 'createdAt'>): Promise<Invitation> {
    const result = await this.db
      .insert(schema.invitations)
      .values({
        email: invitation.email,
        organizationId: invitation.organizationId,
        role: invitation.role,
        token: invitation.token,
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.expiresAt,
        acceptedAt: invitation.acceptedAt,
      })
      .returning();

    return this.mapToEntity(result[0]);
  }

  async markAsAccepted(token: string): Promise<void> {
    await this.db
      .update(schema.invitations)
      .set({ acceptedAt: new Date() })
      .where(eq(schema.invitations.token, token));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(schema.invitations).where(eq(schema.invitations.id, id));
  }

  async deleteExpired(): Promise<void> {
    await this.db
      .delete(schema.invitations)
      .where(
        and(lt(schema.invitations.expiresAt, new Date()), isNull(schema.invitations.acceptedAt)),
      );
  }

  private mapToEntity(row: any): Invitation {
    return Invitation.create({
      id: row.id,
      email: row.email,
      organizationId: row.organizationId,
      role: row.role,
      token: row.token,
      invitedBy: row.invitedBy,
      expiresAt: row.expiresAt,
      acceptedAt: row.acceptedAt,
      createdAt: row.createdAt,
    });
  }
}
