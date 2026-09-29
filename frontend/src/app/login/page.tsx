'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Network,
  ShieldCheck,
  ArrowRight,
  Fingerprint,
  GitCompareArrows,
  Shield,
  Wrench,
  Database,
  Eye,
  Check,
} from 'lucide-react';
import { post } from '@/services/api';
import { useAction } from '@/hooks/use-action';
import { Button } from '@/components/ui/button';
import { Field, Notice } from '@/components/shared';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

const ROLES = [
  {
    id: 'ADMIN',
    title: 'Admin',
    email: 'admin@nmip.local',
    description: 'Full workflows, rules & user administration',
    icon: Shield,
  },
  {
    id: 'ENGINEER',
    title: 'Engineer',
    email: 'engineer@nmip.local',
    description: 'Candidate reviews, evidence & approvals',
    icon: Wrench,
  },
  {
    id: 'DATA_STEWARD',
    title: 'Data Steward',
    email: 'steward@nmip.local',
    description: 'Ingestion, mapping, validation & imports',
    icon: Database,
  },
  {
    id: 'VIEWER',
    title: 'Viewer',
    email: 'viewer@nmip.local',
    description: 'Catalog inspection, analytics & audit logs',
    icon: Eye,
  },
];

const DEFAULT_DEMO_PASS = 'Nmip-Demo-2026!';

export default function Login() {
  const router = useRouter();
  const action = useAction();
  const [selectedRole, setSelectedRole] = useState<string>('ADMIN');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: 'admin@nmip.local',
      password: DEFAULT_DEMO_PASS,
    },
  });

  const selectRole = (roleId: string, email: string) => {
    setSelectedRole(roleId);
    setValue('email', email, { shouldValidate: true });
    setValue('password', DEFAULT_DEMO_PASS, { shouldValidate: true });
  };

  return (
    <div className="login-layout">
      <section className="login-story">
        <div className="login-brand">
          <Network size={34} />
          <strong>NMIP</strong>
        </div>
        <div>
          <div className="eyebrow">NATIONAL MATERIAL INTELLIGENCE PLATFORM</div>
          <h1>
            Different codes.
            <br />
            Verified identities.
            <br />
            <span>No blind merges.</span>
          </h1>
          <p>
            A shared material language, grounded in engineering evidence and human judgment.
          </p>
          <div className="login-principles">
            <div>
              <GitCompareArrows />
              Discover candidates
            </div>
            <div>
              <ShieldCheck />
              Validate the engineering
            </div>
            <div>
              <Fingerprint />
              Approve with confidence
            </div>
          </div>
        </div>
        <small>National workspace · Secure Role-Based Access</small>
      </section>

      <section className="login-form">
        <div className="login-form-inner">
          <div className="eyebrow">PUBLIC DEMO · JUDGES & VISITORS</div>
          <h2>Welcome to NMIP</h2>
          <p className="muted">Everyone is welcome to try the project. No registration is needed: choose a demo role, then sign in with the prefilled credentials.</p>
          <section className="notice" aria-label="Public demo credentials">
            <div>
              <strong>Demo password for all four accounts</strong>
              <p style={{ margin: '6px 0' }}><code>{DEFAULT_DEMO_PASS}</code></p>
              <span className="small">Choose Admin to explore the full project, Engineer to give human reviews, or Viewer for a read-only tour. These shared accounts use synthetic demo data.</span>
            </div>
          </section>

          <div className="role-select-section">
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#71849b', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
              CHOOSE A WORKSPACE ROLE
            </span>
            <div className="role-grid">
              {ROLES.map((role) => {
                const IconComponent = role.icon;
                const isActive = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    className={`role-card ${isActive ? 'active' : ''}`}
                    onClick={() => selectRole(role.id, role.email)}
                  >
                    <div className="role-card-header">
                      <div className="role-card-icon">
                        <IconComponent size={16} />
                      </div>
                      {isActive && (
                        <div className="role-check-badge">
                          <Check size={11} />
                        </div>
                      )}
                    </div>
                    <div className="role-card-title">{role.title}</div>
                    <div className="role-card-desc">{role.description}</div>
                    <div className="small" style={{ overflowWrap: 'anywhere', marginTop: 6 }}>{role.email}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <form
            onSubmit={handleSubmit(async (values) => {
              const user = await action.run(() => post('/auth/login', values), 'Signed in.');
              if (user) router.push('/dashboard');
            })}
          >
            <Field title="Email address">
              <input
                autoComplete="username"
                placeholder="you@organization.in"
                {...register('email')}
              />
            </Field>
            {errors.email && <span className="form-error">{errors.email.message}</span>}

            <Field title="Password">
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                {...register('password')}
              />
            </Field>
            {errors.password && <span className="form-error">{errors.password.message}</span>}

            <Notice {...action} />

            <Button disabled={action.busy} className="full">
              {action.busy
                ? 'Signing in…'
                : `Sign in as ${ROLES.find((r) => r.id === selectedRole)?.title || 'Workspace'}`}
              <ArrowRight size={17} />
            </Button>
          </form>

          <div className="login-note">
            <ShieldCheck size={18} />
            <p>Role-based access. Every consequential decision is recorded and traceable.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
