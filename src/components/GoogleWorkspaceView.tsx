import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  HardDrive, 
  Mail, 
  FileText, 
  MapPin, 
  Plus, 
  Send, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User as UserIcon, 
  LogOut,
  Sparkles
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  googleLogout, 
  getAccessToken 
} from '../services/googleAuth';
import { 
  getCalendarEvents, 
  createCalendarEvent, 
  getDriveFiles, 
  getGmailMessages, 
  sendGmailEmail, 
  createGoogleDoc,
  CalendarEvent, 
  DriveFile, 
  GmailMessageItem 
} from '../services/googleWorkspace';
import { GoogleMapsView } from './GoogleMapsView';
import { EvolveState, Client } from '../types';
import { getTbilisiTodayDate, getTbilisiTime24 } from '../utils/date';

interface GoogleWorkspaceViewProps {
  state: EvolveState;
  onSelectClient?: (client: Client) => void;
}

type WorkspaceTab = 'CALENDAR' | 'DRIVE_DOCS' | 'GMAIL' | 'MAPS';

export const GoogleWorkspaceView: React.FC<GoogleWorkspaceViewProps> = ({ state, onSelectClient }) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('CALENDAR');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Data states
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [gmailMessages, setGmailMessages] = useState<GmailMessageItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // Confirmation modal state for destructive / mutating operations
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionType: 'SEND_EMAIL' | 'CREATE_CALENDAR' | 'CREATE_DOC';
    payload: any;
  } | null>(null);

  // Form states for creation
  const [newCalEvent, setNewCalEvent] = useState({
    summary: '',
    description: '',
    location: 'Tbilisi HQ / Google Meet',
    date: getTbilisiTodayDate(),
    time: '11:00',
    durationMinutes: 45,
  });

  const [newEmail, setNewEmail] = useState({
    to: '',
    subject: '',
    body: '',
  });

  const [newDoc, setNewDoc] = useState({
    title: '',
    initialText: '',
  });

  // Check auth state on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        setIsLoadingAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setIsLoadingAuth(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch data when token is ready or tab changes
  useEffect(() => {
    if (token) {
      loadTabData(activeTab, token);
    }
  }, [token, activeTab]);

  const loadTabData = async (tab: WorkspaceTab, authToken: string) => {
    setIsLoadingData(true);
    setErrorMsg(null);
    try {
      if (tab === 'CALENDAR') {
        const events = await getCalendarEvents(authToken);
        setCalendarEvents(events);
      } else if (tab === 'DRIVE_DOCS') {
        const files = await getDriveFiles(authToken);
        setDriveFiles(files);
      } else if (tab === 'GMAIL') {
        const msgs = await getGmailMessages(authToken);
        setGmailMessages(msgs);
      }
    } catch (err: any) {
      console.warn('Workspace data fetch notice:', err.message);
      setErrorMsg(err.message || 'მონაცემების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google ანგარიშით შესვლა ვერ მოხერხდა');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await googleLogout();
    setUser(null);
    setToken(null);
    setCalendarEvents([]);
    setDriveFiles([]);
    setGmailMessages([]);
  };

  // Execution after confirmation
  const handleExecuteConfirmedAction = async () => {
    if (!confirmationModal || !token) return;
    const { actionType, payload } = confirmationModal;
    setConfirmationModal(null);
    setIsLoadingData(true);
    setErrorMsg(null);

    try {
      if (actionType === 'SEND_EMAIL') {
        await sendGmailEmail(token, payload.to, payload.subject, payload.body);
        setNewEmail({ to: '', subject: '', body: '' });
        await loadTabData('GMAIL', token);
      } else if (actionType === 'CREATE_CALENDAR') {
        await createCalendarEvent(token, payload);
        setNewCalEvent({
          summary: '',
          description: '',
          location: 'Tbilisi HQ / Google Meet',
          date: getTbilisiTodayDate(),
          time: '11:00',
          durationMinutes: 45,
        });
        await loadTabData('CALENDAR', token);
      } else if (actionType === 'CREATE_DOC') {
        const doc = await createGoogleDoc(token, payload.title, payload.initialText);
        setNewDoc({ title: '', initialText: '' });
        await loadTabData('DRIVE_DOCS', token);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'ოპერაციის შესრულება ვერ მოხერხდა');
    } finally {
      setIsLoadingData(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Top Banner & Authentication Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-neutral-800 bg-neutral-900/70 shadow-lg">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span>GOOGLE WORKSPACE & MAPS SUITE</span>
          </h1>
          <p className="text-xs text-neutral-400 pt-1">
            პირდაპირი ინტეგრაცია: Google Calendar, Drive, Gmail, Docs და Google Maps
          </p>
        </div>

        {/* Google Sign-in / User Profile Bar */}
        <div>
          {isLoadingAuth ? (
            <div className="text-xs text-neutral-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>ავტორიზაციის შემოწმება...</span>
            </div>
          ) : user ? (
            <div className="flex items-center gap-3 bg-neutral-950 p-1.5 px-3 rounded-xl border border-neutral-800">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full border border-neutral-700 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center text-xs font-bold">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="space-y-0.2">
                <div className="text-xs font-medium text-neutral-200">
                  {user.displayName || 'Google მომხმარებელი'}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono">{user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 rounded-lg transition cursor-pointer"
                title="გამოსვლა (Sign out)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Official Google Sign-In Styled Button */
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-semibold rounded-xl flex items-center gap-2.5 transition shadow-sm cursor-pointer border border-neutral-300 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSigningIn ? 'ავტორიზაცია...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Error / Alert notice */}
      {errorMsg && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-neutral-400 hover:text-neutral-200 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Primary Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'CALENDAR' as const, label: 'Google Calendar', icon: <Calendar className="w-4 h-4" /> },
          { id: 'DRIVE_DOCS' as const, label: 'Google Drive & Docs', icon: <HardDrive className="w-4 h-4" /> },
          { id: 'GMAIL' as const, label: 'Gmail', icon: <Mail className="w-4 h-4" /> },
          { id: 'MAPS' as const, label: 'Google Maps რუკა', icon: <MapPin className="w-4 h-4" /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
              }`}
            >
              <span className={isActive ? 'text-emerald-400' : 'text-neutral-500'}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}

        {token && (
          <button
            onClick={() => loadTabData(activeTab, token)}
            disabled={isLoadingData}
            className="ml-auto p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition cursor-pointer disabled:opacity-50"
            title="მონაცემების განახლება"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. GOOGLE CALENDAR TAB */}
      {/* ========================================================================= */}
      {activeTab === 'CALENDAR' && (
        <div className="space-y-6">
          {!user ? (
            <div className="p-8 text-center rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-3">
              <Calendar className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-neutral-200">
                Google Calendar-ის დასაკავშირებლად საჭიროა Google ავტორიზაცია
              </h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                ავტორიზაციის შემდეგ შეძლებთ თქვენი რეალური შეხვედრებისა და ღონისძიებების ნახვას, ასევე Evolve OS-დან პირდაპირ კალენდარში ღონისძიების ჩანიშვნას.
              </p>
              <button
                onClick={handleSignIn}
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Google ავტორიზაცია
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Event Creation Form */}
              <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider font-mono">
                    ღონისძიების ჩანიშვნა კალენდარში
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-neutral-400 mb-1">სათაური / შეხვედრა</label>
                    <input
                      type="text"
                      placeholder="მაგ: Ronen Q4 შეხვედრა ან Revenue Block"
                      value={newCalEvent.summary}
                      onChange={(e) => setNewCalEvent({ ...newCalEvent, summary: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-neutral-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-neutral-400 mb-1">თარიღი</label>
                      <input
                        type="date"
                        value={newCalEvent.date}
                        onChange={(e) => setNewCalEvent({ ...newCalEvent, date: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1">დრო</label>
                      <input
                        type="time"
                        value={newCalEvent.time}
                        onChange={(e) => setNewCalEvent({ ...newCalEvent, time: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">ლოკაცია</label>
                    <input
                      type="text"
                      value={newCalEvent.location}
                      onChange={(e) => setNewCalEvent({ ...newCalEvent, location: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">აღწერა / დღის წესრიგი</label>
                    <textarea
                      rows={2}
                      placeholder="შეხვედრის დეტალები..."
                      value={newCalEvent.description}
                      onChange={(e) => setNewCalEvent({ ...newCalEvent, description: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    disabled={!newCalEvent.summary.trim()}
                    onClick={() => {
                      const startIso = new Date(`${newCalEvent.date}T${newCalEvent.time}:00`).toISOString();
                      const endIso = new Date(
                        new Date(`${newCalEvent.date}T${newCalEvent.time}:00`).getTime() +
                          newCalEvent.durationMinutes * 60 * 1000
                      ).toISOString();

                      setConfirmationModal({
                        isOpen: true,
                        title: 'Google Calendar-ში ღონისძიების დამატება',
                        description: `ნამდვილად გსურთ "${newCalEvent.summary}"-ის დამატება თქვენს Google Calendar-ში (${newCalEvent.date} ${newCalEvent.time})?`,
                        actionType: 'CREATE_CALENDAR',
                        payload: {
                          summary: newCalEvent.summary,
                          description: newCalEvent.description,
                          location: newCalEvent.location,
                          startIso,
                          endIso,
                        },
                      });
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg font-semibold transition cursor-pointer"
                  >
                    კალენდარში გაგზავნა
                  </button>
                </div>
              </div>

              {/* Events List */}
              <div className="lg:col-span-2 p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider font-mono">
                      მიმდინარე და მომავალი ღონისძიებები ({calendarEvents.length})
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-neutral-800 max-h-[420px] overflow-y-auto no-scrollbar">
                  {calendarEvents.length === 0 ? (
                    <div className="py-8 text-center text-xs text-neutral-500">
                      {isLoadingData ? 'იტვირთება კალენდარი...' : 'ღონისძიებები არ მოიძებნა'}
                    </div>
                  ) : (
                    calendarEvents.map((evt) => (
                      <div key={evt.id} className="py-3 flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-neutral-200 flex items-center gap-2">
                            <span>{evt.summary || 'უსათაურო'}</span>
                            {evt.htmlLink && (
                              <a
                                href={evt.htmlLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-neutral-500 hover:text-emerald-400 transition"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-400 flex items-center gap-2 font-mono">
                            <Clock className="w-3 h-3 text-neutral-500" />
                            <span>
                              {evt.start.dateTime
                                ? new Date(evt.start.dateTime).toLocaleString('ka-GE', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : evt.start.date}
                            </span>
                          </div>
                          {evt.location && (
                            <div className="text-[11px] text-neutral-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-neutral-600" />
                              <span>{evt.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. GOOGLE DRIVE & DOCS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'DRIVE_DOCS' && (
        <div className="space-y-6">
          {!user ? (
            <div className="p-8 text-center rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-3">
              <HardDrive className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-neutral-200">
                Google Drive & Docs-ის დასაკავშირებლად საჭიროა ავტორიზაცია
              </h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                ნახეთ თქვენი დოკუმენტები, ფაილები და შექმენით ახალი მემორანდუმები ან შეთავაზებები Google Docs-ში 1 დაკლიკებით.
              </p>
              <button
                onClick={handleSignIn}
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Google ავტორიზაცია
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Create Doc Form */}
              <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider font-mono">
                    ახალი Google Doc-ის შექმნა
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-neutral-400 mb-1">დოკუმენტის სათაური</label>
                    <input
                      type="text"
                      placeholder="მაგ: Ronen Proposal Q4 ან Executive Summary"
                      value={newDoc.title}
                      onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-neutral-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">საწყისი ტექსტი</label>
                    <textarea
                      rows={5}
                      placeholder="დოკუმენტის შინაარსი..."
                      value={newDoc.initialText}
                      onChange={(e) => setNewDoc({ ...newDoc, initialText: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    disabled={!newDoc.title.trim()}
                    onClick={() => {
                      setConfirmationModal({
                        isOpen: true,
                        title: 'Google Doc დოკუმენტის შექმნა',
                        description: `ნამდვილად გსურთ დოკუმენტის შექმნა სათაურით: "${newDoc.title}" თქვენს Google Drive-ში?`,
                        actionType: 'CREATE_DOC',
                        payload: newDoc,
                      });
                    }}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-lg font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Google Docs-ში შექმნა</span>
                  </button>
                </div>
              </div>

              {/* Drive Files List */}
              <div className="lg:col-span-2 p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider font-mono">
                      Google Drive ფაილები ({driveFiles.length})
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-neutral-800 max-h-[420px] overflow-y-auto no-scrollbar">
                  {driveFiles.length === 0 ? (
                    <div className="py-8 text-center text-xs text-neutral-500">
                      {isLoadingData ? 'იტვირთება ფაილები...' : 'ფაილები არ მოიძებნა'}
                    </div>
                  ) : (
                    driveFiles.map((file) => (
                      <div key={file.id} className="py-3 flex items-center justify-between gap-3 hover:bg-neutral-850/40 px-2 rounded-lg transition">
                        <div className="flex items-center gap-3">
                          {file.iconLink ? (
                            <img src={file.iconLink} alt="" className="w-4 h-4 shrink-0" referrerPolicy="no-referrer" />
                          ) : (
                            <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
                          )}
                          <div className="space-y-0.5">
                            <div className="text-xs font-semibold text-neutral-200">{file.name}</div>
                            <div className="text-[10px] font-mono text-neutral-500">
                              {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('ka-GE') : ''}
                            </div>
                          </div>
                        </div>

                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded flex items-center gap-1 transition"
                          >
                            <span>გახსნა</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. GMAIL TAB */}
      {/* ========================================================================= */}
      {activeTab === 'GMAIL' && (
        <div className="space-y-6">
          {!user ? (
            <div className="p-8 text-center rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-3">
              <Mail className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-neutral-200">
                Gmail-ის დასაკავშირებლად საჭიროა ავტორიზაცია
              </h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                ნახეთ თქვენი წერილები, გაგზავნეთ Follow-up შეტყობინებები კლიენტებთან და მართეთ კომუნიკაცია.
              </p>
              <button
                onClick={handleSignIn}
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Google ავტორიზაცია
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Compose Email */}
              <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider font-mono">
                    ელ-ფოსტის გაგზავნა (Gmail)
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-neutral-400 mb-1">ადრესატი (To:)</label>
                    <input
                      type="email"
                      placeholder="client@example.com"
                      value={newEmail.to}
                      onChange={(e) => setNewEmail({ ...newEmail, to: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">თემა (Subject)</label>
                    <input
                      type="text"
                      placeholder="მაგ: EVOLVE OS შეთანხმება / Follow-up"
                      value={newEmail.subject}
                      onChange={(e) => setNewEmail({ ...newEmail, subject: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-neutral-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">შეტყობინების ტექსტი</label>
                    <textarea
                      rows={5}
                      placeholder="მოგესალმებით, გიგზავნით განხილულ პირობებს..."
                      value={newEmail.body}
                      onChange={(e) => setNewEmail({ ...newEmail, body: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Mandatory confirmation before sending */}
                  <button
                    disabled={!newEmail.to.trim() || !newEmail.subject.trim()}
                    onClick={() => {
                      setConfirmationModal({
                        isOpen: true,
                        title: 'ელ-ფოსტის გაგზავნის დადასტურება',
                        description: `ნამდვილად გსურთ წერილის გაგზავნა ადრესატთან "${newEmail.to}" თემით: "${newEmail.subject}"?`,
                        actionType: 'SEND_EMAIL',
                        payload: newEmail,
                      });
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>წერილის გაგზავნა</span>
                  </button>
                </div>
              </div>

              {/* Inbox Messages */}
              <div className="lg:col-span-2 p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider font-mono">
                      შემოსული წერილები ({gmailMessages.length})
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-neutral-800 max-h-[420px] overflow-y-auto no-scrollbar">
                  {gmailMessages.length === 0 ? (
                    <div className="py-8 text-center text-xs text-neutral-500">
                      {isLoadingData ? 'იტვირთება წერილები...' : 'წერილები არ მოიძებნა'}
                    </div>
                  ) : (
                    gmailMessages.map((msg) => (
                      <div key={msg.id} className="py-3 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-neutral-200 truncate">{msg.from}</span>
                          <span className="text-[10px] font-mono text-neutral-500 shrink-0">{msg.date}</span>
                        </div>
                        <div className="text-xs font-medium text-emerald-400">{msg.subject}</div>
                        <div className="text-[11px] text-neutral-400 line-clamp-2">{msg.snippet}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. GOOGLE MAPS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'MAPS' && (
        <GoogleMapsView clients={state.clients} onSelectClient={onSelectClient} />
      )}

      {/* ========================================================================= */}
      {/* MANDATORY CONFIRMATION MODAL FOR DESTRUCTIVE / SENDING WORKSPACE ACTIONS */}
      {/* ========================================================================= */}
      {confirmationModal && confirmationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full rounded-2xl border border-neutral-700 bg-neutral-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-100">{confirmationModal.title}</h3>
                <p className="text-xs text-neutral-400 mt-0.5">მოქმედების დადასტურება</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950 p-3 rounded-xl border border-neutral-800">
              {confirmationModal.description}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmationModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition cursor-pointer"
              >
                გაუქმება
              </button>
              <button
                onClick={handleExecuteConfirmedAction}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition cursor-pointer shadow-sm"
              >
                დადასტურება და შესრულება
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
