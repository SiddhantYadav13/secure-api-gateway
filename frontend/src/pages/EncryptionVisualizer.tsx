// EncryptionVisualizer — shows the full AES + RSA + SHA-256 + signature pipeline.

import { useState } from "react";
import { motion } from "framer-motion";
import {
  LockKeyhole,
  Lock,
  Unlock,
  KeyRound,
  Hash,
  FileSignature,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import api from "../services/api";
import { Card, Spinner, SectionHeading, Badge } from "../components/ui";
import type { CryptoDemo } from "../types";

function Mono({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-400">
        {icon} {label}
      </div>
      <p className="font-mono text-[11px] text-accent break-all leading-relaxed max-h-24 overflow-y-auto">
        {value}
      </p>
    </div>
  );
}

export default function EncryptionVisualizer() {
  const [plaintext, setPlaintext] = useState("Transfer $5000 to account 4471");
  const [result, setResult] = useState<CryptoDemo | null>(null);
  const [loading, setLoading] = useState(false);

  const encrypt = async () => {
    if (!plaintext.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post("/crypto/demo", { plaintext });
      // small delay so the animation reads as "processing"
      setTimeout(() => {
        setResult(data);
        setLoading(false);
      }, 700);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div>
      <SectionHeading
        icon={<LockKeyhole size={22} />}
        title="Encryption Visualizer"
        subtitle="Hybrid encryption in action: AES-256 protects the data, RSA-2048 protects the key."
      />

      {/* Input + animated pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <Card>
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Unlock size={18} className="text-success" /> Plaintext
          </h3>
          <textarea
            className="input-field h-32 resize-none"
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value)}
            placeholder="Type a secret message..."
          />
          <button onClick={encrypt} disabled={loading} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
            {loading ? <Spinner /> : <><Lock size={18} /> Encrypt & Sign</>}
          </button>
        </Card>

        {/* Middle animation */}
        <Card className="flex flex-col items-center justify-center">
          <motion.div
            animate={loading ? { rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: loading ? Infinity : 0, duration: 0.8 }}
            className={`p-6 rounded-full ${loading ? "bg-warning/20 text-warning" : result ? "bg-success/20 text-success" : "bg-white/5 text-slate-400"}`}
          >
            {loading ? <Lock size={40} /> : result ? <CheckCircle2 size={40} /> : <LockKeyhole size={40} />}
          </motion.div>
          <p className="text-sm text-slate-400 mt-4 text-center">
            {loading ? "Encrypting with AES-256…" : result ? "Encrypted & signed" : "Awaiting input"}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-3">
            AES <ArrowRight size={10} /> RSA <ArrowRight size={10} /> SHA-256 <ArrowRight size={10} /> Sign
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Lock size={18} className="text-danger" /> Ciphertext
          </h3>
          {result ? (
            <p className="font-mono text-[11px] text-danger break-all leading-relaxed h-32 overflow-y-auto rounded-lg bg-white/5 p-3">
              {result.ciphertext}
            </p>
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-600 text-sm rounded-lg bg-white/5">
              — encrypted output —
            </div>
          )}
        </Card>
      </div>

      {/* Detailed values */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Mono label="AES-256 Session Key (base64)" value={result.aes_key} icon={<KeyRound size={14} />} />
            <Mono label="RSA-Wrapped AES Key (key exchange)" value={result.wrapped_key} icon={<KeyRound size={14} />} />
            <Mono label="SHA-256 Integrity Hash" value={result.sha256} icon={<Hash size={14} />} />
            <Mono label="Digital Signature (RSA-PSS)" value={result.signature} icon={<FileSignature size={14} />} />
          </div>

          <Card className="mt-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Decrypted Result (round-trip)</p>
                <p className="text-white font-medium">{result.decrypted}</p>
              </div>
              <div className="flex gap-2">
                <Badge tone={result.signature_valid ? "success" : "danger"}>
                  Signature {result.signature_valid ? "valid" : "invalid"}
                </Badge>
                <Badge tone={result.hash_valid ? "success" : "danger"}>
                  Hash {result.hash_valid ? "verified" : "mismatch"}
                </Badge>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
