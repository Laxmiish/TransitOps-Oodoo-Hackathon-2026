import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Waypoints, KeyRound, Mail, HelpCircle } from 'lucide-react';
import { Field, Input, Button, Select } from '../components/common/Field';
import Alert from '../components/common/Alert';
import Modal from '../components/common/Modal';
import { upsert, nextId, collection } from '../services/localStore';

var ACCOUNTS = [
  { role: 'Fleet Manager', email: 'fleet.manager@transitops.io' },
  { role: 'Driver', email: 'driver@transitops.io' },
  { role: 'Safety Officer', email: 'safety.officer@transitops.io' },
  { role: 'Financial Analyst', email: 'analyst@transitops.io' },
];

const ONBOARDING_BOARD = [
  { step: '1. Account Creation', detail: 'Assign Role: Customer', status: 'ACTIVE' },
  { step: '2. Database Registration', detail: 'Saving to ACCOUNTS & LocalStore', status: 'PENDING' },
  { step: '3. Platform Access', detail: 'Access Dashboard & Trips', status: 'PENDING' },
];

const SECURITY_QUESTIONS = [
  "What city were you born in?"
];

export default function Sign() {
  const [mode, setMode] = useState('signup'); // 'signup' | 'reset'

  // Sign up States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(ACCOUNTS[0].role);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Security Question Modal States
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');

  // Google Sign-in Modal States
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googlePassword, setGooglePassword] = useState('');
  const [googleError, setGoogleError] = useState('');

  // Password Reset States
  const [resetStep, setResetStep] = useState(1); // 1, 2, or 3
  const [resetEmail, setResetEmail] = useState('');
  const [resetUser, setResetUser] = useState(null);
  const [resetAnswerInput, setResetAnswerInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Validate signup form inputs and open security question modal
  function handleSignUpClick(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password not matched');
      return;
    }

    // Check if email already exists in local ACCOUNTS
    const emailExists = ACCOUNTS.some(
      (acc) => acc.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (emailExists) {
      setError('An account with this email already exists.');
      return;
    }

    // Validation passed, open security question modal
    setSelectedQuestion(SECURITY_QUESTIONS[0]);
    setSecurityAnswer('');
    setSecurityModalOpen(true);
  }

  // Handle completion of registration from security question modal
  function handleCompleteRegistration(e) {
    e.preventDefault();
    setError('');

    if (!securityAnswer.trim()) {
      setError('Please provide an answer to the security question.');
      return;
    }

    setSubmitting(true);
    setSecurityModalOpen(false);

    try {
      // Store in ACCOUNTS variable
      ACCOUNTS.push({
        role: role,
        email: email.trim(),
        password: password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        securityQuestion: selectedQuestion,
        securityAnswer: securityAnswer.trim()
      });

      // Also upsert into mock users database
      const newUser = {
        id: nextId('u'),
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        password: password,
        role: role,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        securityQuestion: selectedQuestion,
        securityAnswer: securityAnswer.trim()
      };
      upsert('users', newUser);

      setSuccess(true);
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRole(ACCOUNTS[0].role);
    } catch (err) {
      setError(err.message || 'Unable to create account.');
    } finally {
      setSubmitting(false);
    }
  }

  // Handle simulated Gmail/Google authentication modal submit
  function handleGoogleSubmit(e) {
    e.preventDefault();
    setGoogleError('');

    if (!googleEmail.trim() || !googlePassword.trim()) {
      setGoogleError('Please fill in all Google credentials.');
      return;
    }

    if (!googleEmail.trim().toLowerCase().endsWith('@gmail.com')) {
      setGoogleError('Must use a valid Gmail ID (ending with @gmail.com).');
      return;
    }

    if (googlePassword.length < 6) {
      setGoogleError('Password must be at least 6 characters long.');
      return;
    }

    // Check if email already exists
    const usersList = collection('users');
    const emailExists = usersList.some(
      (u) => u.email.toLowerCase() === googleEmail.trim().toLowerCase()
    ) || ACCOUNTS.some(
      (acc) => acc.email.toLowerCase() === googleEmail.trim().toLowerCase()
    );

    if (emailExists) {
      setGoogleError('An account with this Gmail ID already exists.');
      return;
    }

    // Set sign up fields and open security question modal
    const emailName = googleEmail.trim().split('@')[0];
    const parts = emailName.split('.');
    const first = parts[0] || 'Google';
    const last = parts[1] || 'User';
    setFirstName(first.charAt(0).toUpperCase() + first.slice(1));
    setLastName(last.charAt(0).toUpperCase() + last.slice(1));
    setPhone('+1 (555) 019-2834');
    setEmail(googleEmail.trim());
    setPassword(googlePassword);
    setConfirmPassword(googlePassword);
    setGoogleModalOpen(false);

    setSelectedQuestion(SECURITY_QUESTIONS[0]);
    setSecurityAnswer('');
    setSecurityModalOpen(true);
  }

  // Reset Password Flow - Step 1: Find User
  function handleResetStep1(e) {
    e.preventDefault();
    setResetError('');

    if (!resetEmail.trim()) {
      setResetError('Please enter your email address.');
      return;
    }

    const usersList = collection('users');
    let user = usersList.find(
      (u) => u.email.toLowerCase() === resetEmail.trim().toLowerCase()
    );

    // Fallback: search in ACCOUNTS array if not in database
    if (!user) {
      const fallbackAcc = ACCOUNTS.find(
        (acc) => acc.email.toLowerCase() === resetEmail.trim().toLowerCase()
      );
      if (fallbackAcc) {
        user = {
          id: nextId('u'),
          name: fallbackAcc.email.split('@')[0],
          email: fallbackAcc.email,
          password: fallbackAcc.password || 'password123',
          role: fallbackAcc.role,
          securityQuestion: fallbackAcc.securityQuestion,
          securityAnswer: fallbackAcc.securityAnswer
        };
      }
    }

    if (!user) {
      setResetError('No user account found with that email.');
      return;
    }

    // If no security question exists (e.g. demo account), assign a default one
    if (!user.securityQuestion) {
      user.securityQuestion = "What is your default role?";
      user.securityAnswer = user.role;
    }

    setResetUser(user);
    setResetStep(2);
    setResetAnswerInput('');
  }

  // Reset Password Flow - Step 2: Answer Security Question
  function handleResetStep2(e) {
    e.preventDefault();
    setResetError('');

    if (!resetAnswerInput.trim()) {
      setResetError('Please enter your answer.');
      return;
    }

    const actualAnswer = String(resetUser.securityAnswer || '').trim().toLowerCase();
    const inputAnswer = resetAnswerInput.trim().toLowerCase();

    if (actualAnswer !== inputAnswer) {
      setResetError('Incorrect answer to security question.');
      return;
    }

    setResetStep(3);
    setNewPassword('');
    setNewPasswordConfirm('');
  }

  // Reset Password Flow - Step 3: Set New Password
  function handleResetStep3(e) {
    e.preventDefault();
    setResetError('');

    if (!newPassword.trim() || !newPasswordConfirm.trim()) {
      setResetError('Please enter and confirm your new password.');
      return;
    }

    if (newPassword.length < 6) {
      setResetError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setResetError('Passwords do not match.');
      return;
    }

    try {
      const updatedUser = {
        ...resetUser,
        password: newPassword
      };

      // Save to database
      upsert('users', updatedUser);

      // Also update ACCOUNTS array
      const idx = ACCOUNTS.findIndex(
        (acc) => acc.email.toLowerCase() === resetUser.email.toLowerCase()
      );
      if (idx >= 0) {
        ACCOUNTS[idx] = {
          ...ACCOUNTS[idx],
          password: newPassword
        };
      } else {
        ACCOUNTS.push({
          role: resetUser.role,
          email: resetUser.email,
          password: newPassword,
          securityQuestion: resetUser.securityQuestion,
          securityAnswer: resetUser.securityAnswer
        });
      }

      setResetSuccess('Password reset successfully! You can now sign in with your new password.');
      setResetStep(1);
      setResetEmail('');
      setResetUser(null);
    } catch (err) {
      setResetError(err.message || 'Failed to update password.');
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Visual panel: onboarding board */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[var(--color-ink)] p-10 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-accent)]">
            <Waypoints size={20} className="text-[var(--color-ink)]" strokeWidth={2.4} />
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-white">TransitOps</p>
            <p className="text-xs text-[var(--color-text-onink)]">Smart Transport Operations Platform</p>
          </div>
        </div>

        <div className="board-panel rounded-2xl p-5">
          <div className="mb-3 flex items-center justify-between font-mono text-[11px] tracking-widest text-[var(--color-text-onink)]">
            <span>
              {mode === 'signup' ? 'ONBOARDING FLOW' : 'PASSWORD RECOVERY'}
            </span>
            <span className="board-flicker text-[var(--color-accent)]">● ACTIVE</span>
          </div>

          {mode === 'signup' ? (
            ONBOARDING_BOARD.map((row, idx) => (
              <div key={idx} className="board-row grid grid-cols-[1fr_auto_auto] items-center gap-4 py-2.5 font-mono text-xs">
                <span className="truncate text-white">{row.step}</span>
                <span className="text-[var(--color-text-onink)]">
                  {idx === 0 ? `Assign Role: ${role}` : row.detail}
                </span>
                <span className={row.status === 'ACTIVE' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-onink)] opacity-55'}>
                  {row.status}
                </span>
              </div>
            ))
          ) : (
            <div className="space-y-3 font-mono text-xs text-[var(--color-text-onink)]">
              <p className={resetStep >= 1 ? "text-[var(--color-accent)] font-semibold" : "opacity-55"}>
                ✓ Step 1: Account Email Lookup
              </p>
              <p className={resetStep >= 2 ? "text-[var(--color-accent)] font-semibold" : "opacity-55"}>
                {resetStep >= 2 ? "✓" : "●"} Step 2: Answer Security Question
              </p>
              <p className={resetStep >= 3 ? "text-[var(--color-accent)] font-semibold" : "opacity-55"}>
                {resetStep >= 3 ? "✓" : "●"} Step 3: Establish New Password
              </p>
            </div>
          )}
        </div>

        <p className="max-w-sm text-sm leading-relaxed text-[var(--color-text-onink)]">
          {mode === 'signup'
            ? `Join our operations console. Register your ${role.toLowerCase()} account to start managing, tracking and organizing logistics workflows efficiently.`
            : 'Recover access to your account securely. Complete your assigned security answer challenge to create a new passcode.'}
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-[var(--color-surface)] p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-ink)]">
              <Waypoints size={18} className="text-[var(--color-accent)]" />
            </div>
            <p className="font-display text-lg font-semibold">TransitOps</p>
          </div>

          {/* SIGN UP VIEW */}
          {mode === 'signup' && (
            <div>
              <h2 className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">Create your account</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Get started by creating a {role} account today.</p>

              <form onSubmit={handleSignUpClick} className="mt-6 space-y-4">
                {error && <Alert variant="error">{error}</Alert>}
                {success && (
                  <Alert variant="success">
                    Account created successfully! You can now{' '}
                    <Link to="/login" className="underline font-semibold">
                      sign in here
                    </Link>
                    .
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Field label="First Name" required>
                    <Input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      disabled={success}
                    />
                  </Field>
                  <Field label="Last Name" required>
                    <Input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      disabled={success}
                    />
                  </Field>
                </div>

                <Field label="Phone Number" required>
                  <Input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    disabled={success}
                  />
                </Field>

                <Field label="Email address" required>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={success}
                  />
                </Field>

                <Field label="Password" required>
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={success}
                  />
                </Field>

                <Field label="Confirm Password" required>
                  <Input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={success}
                  />
                </Field>

                <Field label="Role" required>
                  <Select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={success}
                  >
                    {Array.from(new Set(ACCOUNTS.map((acc) => acc.role))).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Button type="submit" variant="accent" disabled={submitting || success} className="w-full justify-center">
                  {submitting ? 'Creating account…' : 'Sign up'}
                </Button>

                <div className="relative my-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--color-border)]"></div>
                  </div>
                  <span className="relative bg-[var(--color-surface)] px-3 text-xs text-[var(--color-text-muted)]">
                    Or register with Google
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setGoogleError('');
                    setGoogleEmail('');
                    setGooglePassword('');
                    setGoogleModalOpen(true);
                  }}
                  disabled={success}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-slate-50 focus:outline-none disabled:opacity-50"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.49 3.77v3.12h4.01c2.34-2.16 3.69-5.32 3.69-8.74Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.01-3.12c-1.12.75-2.55 1.19-3.95 1.19-3.04 0-5.61-2.05-6.53-4.82H1.31v3.2A11.99 11.99 0 0 0 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.47 14.34a7.17 7.17 0 0 1 0-2.68V8.46H1.31a11.99 11.99 0 0 0 0 7.08l4.16-3.2Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.94 11.94 0 0 0 12 0 11.99 11.99 0 0 0 1.31 8.46l4.16 3.2c.92-2.77 3.49-4.82 6.53-4.82Z"
                    />
                  </svg>
                  Sign up with Google Gmail
                </button>
              </form>

              <div className="mt-6 flex flex-col gap-2 text-center text-sm">
                <p className="text-[var(--color-text-muted)]">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-[var(--color-accent-dark)] hover:underline">
                    Sign in
                  </Link>
                </p>
                <button
                  onClick={() => {
                    setMode('reset');
                    setResetStep(1);
                    setResetError('');
                    setResetSuccess('');
                  }}
                  className="text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-accent-dark)] hover:underline"
                >
                  Forgot your password? Reset here
                </button>
              </div>
            </div>
          )}

          {/* PASSWORD RESET VIEW */}
          {mode === 'reset' && (
            <div>
              <h2 className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">Reset your password</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {resetStep === 1 && "Step 1: Enter your account email address."}
                {resetStep === 2 && "Step 2: Verification question challenge."}
                {resetStep === 3 && "Step 3: Choose a secure new password."}
              </p>

              {resetError && <div className="mt-4"><Alert variant="error">{resetError}</Alert></div>}
              {resetSuccess && <div className="mt-4"><Alert variant="success">{resetSuccess}</Alert></div>}

              {/* Step 1: Email Input */}
              {resetStep === 1 && (
                <form onSubmit={handleResetStep1} className="mt-6 space-y-4">
                  <Field label="Email address" required>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
                      <Input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="pl-9"
                      />
                    </div>
                  </Field>
                  <Button type="submit" variant="accent" className="w-full justify-center">
                    Find Account
                  </Button>
                </form>
              )}

              {/* Step 2: Answer Security Question */}
              {resetStep === 2 && resetUser && (
                <form onSubmit={handleResetStep2} className="mt-6 space-y-4">
                  <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Security Question
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)] flex items-start gap-1.5">
                      <HelpCircle size={16} className="mt-0.5 shrink-0 text-[var(--color-accent-dark)]" />
                      {resetUser.securityQuestion}
                    </p>
                  </div>

                  <Field label="Security Answer" required>
                    <Input
                      type="text"
                      required
                      value={resetAnswerInput}
                      onChange={(e) => setResetAnswerInput(e.target.value)}
                      placeholder="Enter your security answer"
                    />
                  </Field>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setResetStep(1);
                        setResetUser(null);
                        setResetError('');
                      }}
                      className="flex-1 text-center justify-center"
                    >
                      Back
                    </Button>
                    <Button type="submit" variant="accent" className="flex-1 justify-center">
                      Verify Answer
                    </Button>
                  </div>
                </form>
              )}

              {/* Step 3: Enter New Password */}
              {resetStep === 3 && resetUser && (
                <form onSubmit={handleResetStep3} className="mt-6 space-y-4">
                  <Field label="New Password" required>
                    <div className="relative">
                      <KeyRound size={16} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
                      <Input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="•••••••• (min 6 characters)"
                        className="pl-9"
                      />
                    </div>
                  </Field>

                  <Field label="Confirm New Password" required>
                    <div className="relative">
                      <KeyRound size={16} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
                      <Input
                        type="password"
                        required
                        value={newPasswordConfirm}
                        onChange={(e) => setNewPasswordConfirm(e.target.value)}
                        placeholder="••••••••"
                        className="pl-9"
                      />
                    </div>
                  </Field>

                  <Button type="submit" variant="accent" className="w-full justify-center">
                    Reset Password
                  </Button>
                </form>
              )}

              <div className="mt-6 text-center text-sm">
                <button
                  onClick={() => {
                    setMode('signup');
                    setError('');
                    setSuccess(false);
                  }}
                  className="font-semibold text-[var(--color-accent-dark)] hover:underline"
                >
                  Back to Sign Up
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DIALOGUE BOX (MODAL) FOR SECURITY QUESTION SETUP */}
      <Modal
        open={securityModalOpen}
        title="Set Account Security Question"
        onClose={() => setSecurityModalOpen(false)}
        width="max-w-md"
      >
        <form onSubmit={handleCompleteRegistration} className="space-y-4">
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            Please set a security question and answer to verify your identity and enable password resets later.
          </p>

          <Field label="Choose a Security Question" required>
            <Select
              value={selectedQuestion}
              onChange={(e) => setSelectedQuestion(e.target.value)}
            >
              {SECURITY_QUESTIONS.map((q, idx) => (
                <option key={idx} value={q}>
                  {q}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Your Security Answer" required>
            <Input
              type="text"
              required
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              placeholder="e.g. Fluffy / London / Lincoln School"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSecurityModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="accent">
              Complete Sign Up
            </Button>
          </div>
        </form>
      </Modal>

      {/* GOOGLE SIGN UP SIMULATOR DIALOGUE BOX */}
      <Modal
        open={googleModalOpen}
        title="Simulated Google Sign-in"
        onClose={() => setGoogleModalOpen(false)}
        width="max-w-md"
      >
        <form onSubmit={handleGoogleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg bg-[var(--color-info-soft)] p-3 text-xs text-[var(--color-info)] border border-blue-100">
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 5.48 1 0 6.48 0 13s5.48 12 12.24 12c7.06 0 11.758-4.967 11.758-11.967 0-.807-.087-1.424-.195-1.748H12.24Z"
              />
            </svg>
            <span>This simulates signing in with your Google account credentials.</span>
          </div>

          {googleError && <Alert variant="error">{googleError}</Alert>}

          <Field label="Gmail ID address" required>
            <Input
              type="email"
              required
              value={googleEmail}
              onChange={(e) => setGoogleEmail(e.target.value)}
              placeholder="username@gmail.com"
            />
          </Field>

          <Field label="Choose Password for TransitOps" required>
            <Input
              type="password"
              required
              value={googlePassword}
              onChange={(e) => setGooglePassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setGoogleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="accent">
              Continue
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}