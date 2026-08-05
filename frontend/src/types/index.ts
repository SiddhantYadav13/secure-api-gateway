// Shared TypeScript types mirroring the backend's JSON shapes.
// Keeping them in one place means every component agrees on the data contract.

export interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "client";
  is_blocked: boolean;
  failed_login_attempts: number;
  created_at: string;
}

export interface RiskFactor {
  factor: string;
  label: string;
  points: number;
}

export interface Risk {
  score: number;
  label: "safe" | "suspicious" | "blocked";
  factors: RiskFactor[];
}

export interface AnalyzeResult {
  endpoint: string;
  method: string;
  gates: {
    jwt: string;
    role: string;
    replay: string;
    rate_limit: string;
    hash: string;
  };
  computed_hash: string;
  risk: Risk;
  action: "allow" | "flag" | "reject";
  status: "allowed" | "flagged" | "blocked";
  reason: string;
  log_id: number;
  timestamp: number;
  security: { signature: string; signed_data: string };
}

export interface CryptoDemo {
  plaintext: string;
  aes_key: string;
  nonce: string;
  ciphertext: string;
  auth_tag: string;
  wrapped_key: string;
  sha256: string;
  signature: string;
  decrypted: string;
  signature_valid: boolean;
  hash_valid: boolean;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  username: string;
  endpoint: string;
  method: string;
  ip_address: string;
  jwt_status: string;
  role_status: string;
  hash_status: string;
  replay_status: string;
  rate_limit_status: string;
  status: "allowed" | "flagged" | "blocked";
  http_status: number;
  risk_score: number;
  risk_label: string;
  action_taken: string;
  reason: string;
}

export interface SecurityEvent {
  id: number;
  timestamp: string;
  username: string | null;
  event_type: string;
  severity: "info" | "warning" | "danger" | "success";
  description: string;
  ip_address: string | null;
}

export interface DashboardSummary {
  total_requests: number;
  successful_requests: number;
  blocked_requests: number;
  suspicious_requests: number;
  failed_logins: number;
  replay_attacks: number;
  average_risk: number;
}

export interface GatewaySettings {
  jwt_expiry_minutes: number;
  rate_limit_max_requests: number;
  rate_limit_window_seconds: number;
  replay_window_seconds: number;
  replay_protection_enabled: boolean;
  risk_scoring_enabled: boolean;
  max_failed_logins: number;
}
