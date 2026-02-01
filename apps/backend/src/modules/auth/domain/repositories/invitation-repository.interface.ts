import { Invitation } from '../entities/invitation.entity';

export interface IInvitationRepository {
  findByToken(token: string): Promise<Invitation | null>;
  findByEmail(email: string, organizationId: string): Promise<Invitation | null>;
  findPendingByOrganizationId(organizationId: string): Promise<Invitation[]>;
  create(invitation: Omit<Invitation, 'id' | 'createdAt'>): Promise<Invitation>;
  markAsAccepted(token: string): Promise<void>;
  delete(id: string): Promise<void>;
  deleteExpired(): Promise<void>;
}
