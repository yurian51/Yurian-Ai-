import { IsIn } from 'class-validator';

export class ApprovalDecisionDto {
  @IsIn(['APPROVED', 'REJECTED', 'CANCELLED'])
  status!: 'APPROVED' | 'REJECTED' | 'CANCELLED';
}
