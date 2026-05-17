import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, ChevronLeft, Camera, MessageCircle } from 'lucide-react';
import { useTournaments } from '../hooks/useTournaments';
import { useRegistration } from '../hooks/useRegistration';
import { useAuth } from '../hooks/useAuth';
import { useTournamentCountdown } from '../hooks/useTournamentCountdown';
import { uploadFile } from '../utils/storage';
import GhostInput from '../components/ui/GhostInput';
import WhatsAppModal from '../components/ui/WhatsAppModal';
import toast from 'react-hot-toast';

export default function RegistrationPage() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { tournaments, loading: tLoading } = useTournaments();
  const { submitRegistration, hasPendingRegistration, findDuplicates, submitting } = useRegistration();
  const { user, userDoc, loading: aLoading } = useAuth();
  
  const [form, setForm] = useState({
    team_name: '',
    real_name: '',
    whatsapp_number: '',
    captain_discord: '',
    player_1_ign: '', player_1_id: '',
    player_2_ign: '', player_2_id: '',
    player_3_ign: '', player_3_id: '',
    player_4_ign: '', player_4_id: '',
    player_5_ign: '', player_5_id: '',
    player_6_ign: '', player_6_id: '',
  });
  const [showWAModal, setShowWAModal] = useState(false);

  const handleAutoFill = () => {
    if (!userDoc) return;
    const pids = userDoc.player_ids || [];
    setForm({
      team_name: userDoc.team_name || '',
      real_name: userDoc.display_name || '',
      whatsapp_number: userDoc.whatsapp_number || '',
      captain_discord: userDoc.captain_discord || '',
      player_1_id: pids[0] || '', player_1_ign: userDoc.player_igns?.[0] || '',
      player_2_id: pids[1] || '', player_2_ign: userDoc.player_igns?.[1] || '',
      player_3_id: pids[2] || '', player_3_ign: userDoc.player_igns?.[2] || '',
      player_4_id: pids[3] || '', player_4_ign: userDoc.player_igns?.[3] || '',
      player_5_id: pids[4] || '', player_5_ign: userDoc.player_igns?.[4] || '',
      player_6_id: pids[5] || '', player_6_ign: userDoc.player_igns?.[5] || '',
    });
    toast.success('Profile data synchronized successfully.');
  };

  const [file, setFile] = useState(null);
  const [screenshotFiles, setScreenshotFiles] = useState([null, null, null, null]);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const clearFieldError = (field) => {
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const tournament = tournaments.find(t => t.id === tournamentId);
  const { phase } = useTournamentCountdown(tournament?.registration_open_date, tournament?.registration_deadline);

  useEffect(() => {
    if (aLoading || tLoading) return;
    if (!user) {
      toast.error('You must be signed in to access tournament registrations.');
      navigate('/auth');
      return;
    }
    if (!tournament) {
      toast.error('Tournament not found.');
      navigate('/tournaments');
      return;
    }

    // Guard: Opening phase check
    if (phase === 'opening') {
      toast.error('REGISTRATION PENDING. Registration is not open yet.');
      navigate(`/tournaments/${tournamentId}`);
    }
    
  }, [user, tournament, aLoading, tLoading, tournamentId, navigate, phase]);

  const handleRegisterSub = async (e) => {
    e.preventDefault();
    if (saving || submitting) return;

    // Validate WhatsApp
    const waClean = form.whatsapp_number.trim().replace(/[^0-9]/g, '');
    if (waClean.length !== 11) {
      setFieldErrors(prev => ({ ...prev, whatsapp_number: 'Number must be exactly 11 digits' }));
      return toast.error('WhatsApp number must be exactly 11 digits.', { id: 'reg' });
    }

    // Validate Player IDs & Names (All required and optional if provided)
    const idRegex = /^\d{10,14}$/;
    let firstErrorField = null;
    const squadIDs = new Set();
    const squadIGNs = new Set();
    
    for (let i = 1; i <= 6; i++) {
      const pid = form[`player_${i}_id`]?.trim();
      const pign = form[`player_${i}_ign`]?.trim().toLowerCase();
      
      // Required for 1-4, or if provided for 5-6
      if (i <= 4 || pid || pign) {
        // ID Checks
        if (!pid) {
          if (i <= 4) {
            if (!firstErrorField) firstErrorField = `player_${i}_id`;
            setFieldErrors(prev => ({ ...prev, [`player_${i}_id`]: 'Required' }));
          }
        } else if (!idRegex.test(pid)) {
          if (!firstErrorField) firstErrorField = `player_${i}_id`;
          setFieldErrors(prev => ({ ...prev, [`player_${i}_id`]: 'Invalid ID (10-14 digits)' }));
        } else if (squadIDs.has(pid)) {
          if (!firstErrorField) firstErrorField = `player_${i}_id`;
          setFieldErrors(prev => ({ ...prev, [`player_${i}_id`]: 'Duplicate ID in Squad' }));
        } else {
          squadIDs.add(pid);
        }

        // IGN Checks
        if (!pign) {
          if (i <= 4) {
            if (!firstErrorField) firstErrorField = `player_${i}_ign`;
            setFieldErrors(prev => ({ ...prev, [`player_${i}_ign`]: 'Required' }));
          }
        } else if (squadIGNs.has(pign)) {
          if (!firstErrorField) firstErrorField = `player_${i}_ign`;
          setFieldErrors(prev => ({ ...prev, [`player_${i}_ign`]: 'Duplicate Name in Squad' }));
        } else {
          squadIGNs.add(pign);
        }
      }
    }

    if (firstErrorField) {
      return toast.error('Please fix squad errors (Duplicate names/IDs or invalid formats).', { id: 'reg' });
    }

    // Validate Screenshot Uniqueness
    const uniqueFiles = new Set();
    for (const f of screenshotFiles) {
      if (f) {
        const fileKey = `${f.name}-${f.size}`;
        if (uniqueFiles.has(fileKey)) {
          return toast.error('Each proof screenshot must be a unique image. Please do not upload the same file multiple times.', { id: 'reg' });
        }
        uniqueFiles.add(fileKey);
      }
    }
    
    setSaving(true);
    setFieldErrors({});
    try {
      if (!tournament?.id) throw new Error('Tournament data missing. Please refresh.');

      toast.loading('Stage 1: Verifying squad status...', { id: 'reg' });
      
      const cleanIDs = [
        form.player_1_id, form.player_2_id, form.player_3_id,
        form.player_4_id, form.player_5_id, form.player_6_id
      ].filter(Boolean).map(id => id.trim());

      // Pre-Guard 1: Pending check
      const pending = await hasPendingRegistration(user.id, tournament.id);
      if (pending) {
        setSaving(false);
        return toast.error('You already have a pending registration. Please wait for it to be reviewed.', { id: 'reg' });
      }

      const playerIgns = [
        form.player_1_ign, form.player_2_ign, form.player_3_ign,
        form.player_4_ign, form.player_5_ign, form.player_6_ign
      ].filter((_, i) => !!form[`player_${i+1}_id`]);

      // Pre-Guard 2: Duplicate check
      toast.loading('Stage 2: Scanning for duplicates...', { id: 'reg' });
      const duplicate = await findDuplicates(cleanIDs, playerIgns, form.team_name.trim(), tournament.id);
      if (duplicate) {
        setSaving(false);
        if (duplicate.type === 'team') {
          setFieldErrors(prev => ({ ...prev, team_name: 'Name Taken' }));
          return toast.error(`Team name "${duplicate.value}" is already taken in this tournament.`, { id: 'reg' });
        }
        if (duplicate.type === 'ign') {
          // Find which field it is
          for (let i = 1; i <= 6; i++) {
            if (form[`player_${i}_ign`]?.trim().toLowerCase() === duplicate.value.toLowerCase()) {
              setFieldErrors(prev => ({ ...prev, [`player_${i}_ign`]: 'Already Registered' }));
              break;
            }
          }
          return toast.error(`Player name "${duplicate.value}" is already registered in another squad.`, { id: 'reg' });
        }
        // ID Check
        for (let i = 1; i <= 6; i++) {
          if (form[`player_${i}_id`]?.trim() === duplicate.value) {
            setFieldErrors(prev => ({ ...prev, [`player_${i}_id`]: 'Already Registered' }));
            break;
          }
        }
        return toast.error(`Player ID "${duplicate.value}" is already registered in another squad.`, { id: 'reg' });
      }

      toast.loading('Optimizing tactical assets...', { id: 'reg' });
      const { compressImage } = await import('../utils/image');
      
      // Prepare Upload Tasks
      const uploadTasks = [];
      
      // Task 0: Logo (if exists)
      if (file) {
        const compressedLogo = await compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.7 });
        uploadTasks.push(
          uploadFile('ze-logos', compressedLogo, `logo_${user.id}_${Date.now()}`)
            .catch(err => {
              console.warn('Logo upload failed, proceeding without logo:', err.message);
              return null;
            })
        );
      } else {
        uploadTasks.push(Promise.resolve(null));
      }
      
      // Tasks 1-N: Screenshots (Aggressive compression for faster sync and storage saving)
      const configSS = tournament.registration_config?.screenshots || [];
      for (let i = 0; i < configSS.length; i++) {
        const sFile = screenshotFiles[i];
        if (sFile) {
          const compressedSS = await compressImage(sFile, { maxWidth: 1000, maxHeight: 1000, quality: 0.5 });
          uploadTasks.push(
            uploadFile('ze-proofs', compressedSS, `proof_${i}_${user.id}_${Date.now()}`)
              .catch(err => {
                throw new Error(`Proof upload failed [${configSS[i].label}]: ${err.message}`);
              })
          );
        } else {
          uploadTasks.push(Promise.resolve(null));
        }
      }
      
      toast.loading('Syncing tactical data...', { id: 'reg' });
      
      // Execute all uploads in parallel
      const uploadResults = await Promise.all(uploadTasks);
      
      const logoUrl = uploadResults[0];
      const screenshotURLs = uploadResults.slice(1);
      
      toast.loading('Finalizing registration...', { id: 'reg' });
      
      const result = await submitRegistration({
        uid: user.id,
        tournamentID: tournament.id,
        teamName: form.team_name,
        realName: form.real_name,
        teamLogoURL: logoUrl,
        whatsapp: form.whatsapp_number,
        captainDiscord: form.captain_discord,
        playerIDs: cleanIDs,
        playerIgns: playerIgns,
        screenshotURLs: screenshotURLs
      });

      if (result.success) {
        toast.success('Registration finalized successfully!', { id: 'reg' });
        setShowWAModal(true);
      } else {
        toast.error(result.error || 'Registration failed', { id: 'reg' });
      }
    } catch (err) {
      toast.error(`Registration failed: ${err.message}`, { id: 'reg' });
    } finally {
      setSaving(false);
    }
  };

  if (tLoading || aLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-[2px] bg-[#dbb462] animate-pulse" />
        <span className="font-bebas text-3xl text-[#dbb462] tracking-widest uppercase">Verifying Account</span>
        <div className="w-12 h-[2px] bg-[#dbb462] animate-pulse" />
      </div>
    );
  }
  if (!tournament) return null;

  if (phase === 'closed') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-20 px-6 md:px-12 flex items-center justify-center animate-page-enter">
        <div className="max-w-xl w-full space-y-6 text-center">
          <div className="bg-[#0e0e0e] border border-white/[0.06] p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] zenith-gradient" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#dbb462]/[0.04] blur-[80px] pointer-events-none" />
            <div className="flex flex-col items-center gap-5 mb-8 relative z-10">
              <div className="w-14 h-14 bg-[#dbb462]/10 border border-[#dbb462]/20 flex items-center justify-center">
                <MessageCircle size={26} className="text-[#dbb462]" />
              </div>
              <h1 className="font-bebas text-5xl text-white uppercase tracking-tight">REGISTRATION CLOSED</h1>
            </div>
            <p className="font-teko text-[17px] text-[#d1c5b3] opacity-45 leading-relaxed mb-10 uppercase tracking-wider relative z-10">
              Registrations for this tournament have closed. Contact our support team for any queries.
            </p>
            <a
              href="https://wa.me/923390715753"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between w-full bg-[#0a0a0a] border border-white/[0.06] px-7 py-5 group hover:border-[#dbb462]/30 transition-all relative z-10"
            >
              <div className="text-left">
                <span className="font-teko text-[11px] tracking-[0.3em] text-[#d1c5b3] opacity-30 uppercase block mb-1">Support Team</span>
                <span className="font-bebas text-2xl text-white uppercase tracking-wider">WhatsApp Support</span>
              </div>
              <span className="font-teko text-[13px] tracking-[0.2em] text-[#dbb462] uppercase group-hover:translate-x-1 transition-transform">
                Contact →
              </span>
            </a>
          </div>
          <button
            onClick={() => navigate(`/tournaments/${tournamentId}`)}
            className="font-teko text-[16px] tracking-[0.25em] text-[#dbb462] opacity-50 hover:opacity-100 uppercase transition-opacity"
          >
            ← Return to Tournament Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden animate-page-enter">

      {/* ── Page Header ── */}
      <div className="border-b border-white/[0.05] relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-[#dbb462]/[0.04] blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 md:px-12 pt-32 pb-10 relative z-10">
          <button
            onClick={() => navigate('/tournaments')}
            className="flex items-center gap-2 text-[#d1c5b3] opacity-40 hover:opacity-100 hover:text-[#dbb462] transition-all font-teko text-[14px] tracking-[0.25em] uppercase mb-10"
          >
            <ChevronLeft size={14} /> Cancel Registration
          </button>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-[2px] bg-[#dbb462]" />
            <span className="font-teko text-[13px] tracking-[0.3em] text-[#dbb462] uppercase">Team Registration</span>
          </div>
          <h1 className="font-bebas text-5xl md:text-7xl lg:text-8xl tracking-tight text-[#f2f2f2] uppercase leading-[0.85]">
            {tournament.title}
          </h1>
          {tournament.description && (
            <p className="font-teko text-[16px] text-[#d1c5b3] opacity-40 mt-4 uppercase tracking-wider max-w-2xl">
              {tournament.description}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 space-y-6">

        {/* Autofill Banner */}
        {userDoc && (userDoc.team_name || userDoc.whatsapp_number) && (
          <div className="bg-[#dbb462]/[0.06] border border-[#dbb462]/25 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] zenith-gradient" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-5 p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#dbb462]/15 border border-[#dbb462]/25 flex items-center justify-center flex-shrink-0">
                  <Users size={18} className="text-[#dbb462]" />
                </div>
                <div>
                  <p className="font-bebas text-xl text-white tracking-wider uppercase">Profile Data Detected</p>
                  <p className="font-teko text-[13px] tracking-[0.15em] text-[#d1c5b3] opacity-50 uppercase">
                    Import your saved player details?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAutoFill}
                className="w-full md:w-auto btn-obsidian-primary font-bebas text-[18px] tracking-[0.15em] px-8 py-3 uppercase"
              >
                Fill From Profile
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleRegisterSub} className="space-y-[1px] bg-white/[0.04]">

          {/* ── Section 1: Team Information ── */}
          <FormSection number="01" title="Team Information">
            <div className="flex gap-6 items-center mb-8">
              <div className="w-20 h-20 bg-[#0a0a0a] border border-white/[0.08] flex-shrink-0 flex items-center justify-center overflow-hidden">
                {file ? (
                  <img src={URL.createObjectURL(file)} alt="Logo Preview" className="w-full h-full object-cover" />
                ) : (
                  <Users className="text-[#d1c5b3] opacity-15" size={28} />
                )}
              </div>
              <div className="flex-1">
                <label className="font-teko text-[13px] tracking-[0.25em] text-[#d1c5b3] uppercase block mb-3 opacity-45">
                  Team Logo (Optional){fieldErrors.team_logo && <span className="text-red-400 ml-2">— {fieldErrors.team_logo}</span>}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => { setFile(e.target.files[0]); clearFieldError('team_logo'); }}
                  className="w-full text-[13px] text-[#d1c5b3] file:mr-4 file:py-2 file:px-6 file:border-0 file:bg-[#1a1a1a] file:text-[#dbb462] file:font-teko file:text-[14px] file:cursor-pointer hover:file:bg-[#222] file:uppercase file:tracking-widest"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <GhostInput label="Team Name" value={form.team_name} onChange={e => { setForm(f => ({ ...f, team_name: e.target.value })); clearFieldError('team_name'); }} required placeholder="Enter full team name" error={fieldErrors.team_name} />
              <GhostInput label="Captain Real Name" value={form.real_name} onChange={e => { setForm(f => ({ ...f, real_name: e.target.value })); clearFieldError('real_name'); }} required placeholder="Captain's full name" error={fieldErrors.real_name} />
              <GhostInput label="Captain's WhatsApp" value={form.whatsapp_number} onChange={e => { setForm(f => ({ ...f, whatsapp_number: e.target.value })); clearFieldError('whatsapp_number'); }} required placeholder="03XX XXXXXXX (11 digits)" error={fieldErrors.whatsapp_number} />
              <GhostInput label="Captain's Discord" value={form.captain_discord} onChange={e => { setForm(f => ({ ...f, captain_discord: e.target.value })); clearFieldError('captain_discord'); }} required placeholder="Discord Username" error={fieldErrors.captain_discord} />
            </div>
          </FormSection>

          {/* ── Section 2: Player Roster ── */}
          <FormSection number="02" title="Player Roster" hint="Min 4 required · Player 5–6 optional · IDs must be 10–14 digits">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4, 5, 6].map(num => (
                <div key={num} className="bg-[#0a0a0a] border border-white/[0.05] p-5 relative group hover:border-white/[0.1] transition-colors">
                  {/* Player number badge */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-bebas text-2xl text-[#dbb462] opacity-30 leading-none">{String(num).padStart(2, '0')}</span>
                    <span className="font-teko text-[12px] tracking-[0.25em] text-[#d1c5b3] opacity-40 uppercase">
                      Player {num} {num > 4 && '· Optional'}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <GhostInput
                      label="In-Game Name"
                      value={form[`player_${num}_ign`]}
                      onChange={e => { setForm(f => ({ ...f, [`player_${num}_ign`]: e.target.value })); clearFieldError(`player_${num}_ign`); }}
                      required={num <= 4}
                      placeholder="IGN"
                      error={fieldErrors[`player_${num}_ign`]}
                    />
                    <GhostInput
                      label="Character ID"
                      value={form[`player_${num}_id`]}
                      onChange={e => { setForm(f => ({ ...f, [`player_${num}_id`]: e.target.value })); clearFieldError(`player_${num}_id`); }}
                      required={num <= 4}
                      placeholder="10–14 digit ID"
                      error={fieldErrors[`player_${num}_id`]}
                    />
                  </div>
                </div>
              ))}
            </div>
          </FormSection>

          {/* ── Section 3: Proof Screenshots ── */}
          {tournament.registration_config?.screenshots?.length > 0 && (
            <FormSection number="03" title="Required Proof" hint="Upload the documents listed below">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {tournament.registration_config.screenshots.map((ss, idx) => (
                  <div key={idx} className="space-y-3">
                    <label className="font-teko text-[13px] tracking-[0.25em] text-[#d1c5b3] uppercase block opacity-45">
                      {ss.label} {ss.required && <span className="text-[#dbb462]">*</span>}
                    </label>
                    <div className="relative group min-h-[130px] bg-[#0a0a0a] border border-white/[0.06] hover:border-[#dbb462]/25 transition-colors flex flex-col items-center justify-center p-4">
                      {screenshotFiles[idx] ? (
                        <div className="relative w-full flex flex-col items-center gap-2">
                          <img src={URL.createObjectURL(screenshotFiles[idx])} alt="Proof" className="h-16 w-auto object-contain" />
                          <span className="font-teko text-[13px] text-[#dbb462] tracking-widest uppercase truncate max-w-full">
                            {screenshotFiles[idx].name}
                          </span>
                          <button
                            type="button"
                            onClick={() => { const next = [...screenshotFiles]; next[idx] = null; setScreenshotFiles(next); }}
                            className="font-teko text-[11px] tracking-[0.2em] text-red-400 opacity-50 hover:opacity-100 uppercase transition-opacity"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <>
                          <Camera size={20} className="text-[#d1c5b3] opacity-15 mb-2 group-hover:text-[#dbb462] group-hover:opacity-60 transition-all" />
                          <span className="font-teko text-[12px] tracking-[0.25em] text-[#d1c5b3] opacity-25 group-hover:opacity-50 uppercase transition-opacity">
                            Select Image
                          </span>
                        </>
                      )}
                      <input type="file" accept="image/*" required={ss.required} onChange={(e) => { const f = e.target.files[0]; if (f) { const next = [...screenshotFiles]; next[idx] = f; setScreenshotFiles(next); } }} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  </div>
                ))}
              </div>
            </FormSection>
          )}

          {/* ── Submit ── */}
          <div className="bg-[#0e0e0e] px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-5">
            <p className="font-teko text-[13px] tracking-[0.2em] text-[#d1c5b3] opacity-30 uppercase">
              By submitting, you confirm all player details are accurate.
            </p>
            <button
              type="submit"
              disabled={submitting || saving}
              className="w-full md:w-auto btn-obsidian-primary px-16 py-5 font-bebas text-[26px] tracking-widest uppercase disabled:opacity-40 disabled:cursor-wait"
            >
              {(submitting || saving) ? 'PROCESSING...' : 'REGISTER TEAM'}
            </button>
          </div>

        </form>
      </div>
    </div>
    <WhatsAppModal isOpen={showWAModal} onClose={() => { setShowWAModal(false); navigate('/tournaments'); }} />
    </>
  );
}

function FormSection({ number, title, hint, children }) {
  return (
    <div className="bg-[#0e0e0e] p-8 relative">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/[0.04]" />
      <div className="flex items-start gap-5 mb-7">
        <span className="font-bebas text-[2.5rem] text-[#dbb462] opacity-15 leading-none select-none">{number}</span>
        <div>
          <h2 className="font-bebas text-2xl text-[#f2f2f2] tracking-wider uppercase leading-none mb-1">{title}</h2>
          {hint && (
            <p className="font-teko text-[12px] tracking-[0.2em] text-[#d1c5b3] opacity-35 uppercase">{hint}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
