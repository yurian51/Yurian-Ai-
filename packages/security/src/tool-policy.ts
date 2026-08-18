export type ToolRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ToolPolicyInput {
  riskLevel: ToolRiskLevel;
  requiresApproval: boolean;
  userApproved: boolean;
  allowed: boolean;
}

export function canExecuteTool(input: ToolPolicyInput): boolean {
  if (!input.allowed) return false;
  if (input.riskLevel === 'LOW') return true;
  if (input.requiresApproval) return input.userApproved;
  return input.riskLevel === 'MEDIUM';
}
