/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  Plus,
  Download,
  Upload,
  CheckCircle,
  Database,
  UserPlus,
  Trash2,
} from 'lucide-react';
import { Employee, AttendanceRecord } from './types/attendance';
import {
  loadEmployees,
  saveEmployees,
  loadAttendance,
  saveAttendance,
  calculateSummary,
  exportToCSV,
  exportBackupJSON,
  deduplicateAttendance,
} from './utils/storage';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { AttendanceTable } from './components/AttendanceTable';
import { AttendanceFormModal } from './components/AttendanceFormModal';
import { EmployeeManagerModal } from './components/EmployeeManagerModal';
import { MonthlyReportView } from './components/MonthlyReportView';
import { RulesInfoModal } from './components/RulesInfoModal';
import { FirebaseStatusModal } from './components/FirebaseStatusModal';
import { LoginScreen } from './components/LoginScreen';
import {
  testFirestoreConnection,
  testWritePermission,
  syncEmployeeToCloud,
  deleteEmployeeFromCloud,
  syncAttendanceToCloud,
  deleteAttendanceFromCloud,
  subscribeCloudEmployees,
  subscribeCloudAttendance,
  fetchAllFromCloud,
  auth,
  signOutFirebase,
  db,
} from './firebase/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  // Navigation & Filter state
  const [activeTab, setActiveTab] = useState<'attendance' | 'summary' | 'employees'>('attendance');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');

  // Default to current year-month e.g. 2026-10
  const currentMonthStr = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // Modals state
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

  // Firebase connection & sync state
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecked(true);
    });

    // Test Firebase connection
    testFirestoreConnection().then((res) => {
      setIsFirebaseConnected(res.connected);
      if (!res.connected) {
        setCloudSyncError('Client is offline or network restricted');
      }
    });

    return () => unsubAuth();
  }, []);

  // When currentUser changes, load and subscribe to their isolated data
  useEffect(() => {
    if (!currentUser) {
      setEmployees([]);
      setAttendance([]);
      return;
    }

    const uid = currentUser.uid;

    // Test if user can write to cloud
    testWritePermission(uid).then((canWrite) => {
      if (!canWrite) {
        setCloudSyncError('Firebase Console me Firestore Rules locked hain. Cloud sync pause hai.');
      } else {
        setCloudSyncError(null);
      }
    });

    // 1. Load local cache for instant initial render
    const cachedEmps = loadEmployees(uid);
    setEmployees(cachedEmps);
    const cachedRecs = loadAttendance(uid);
    setAttendance(cachedRecs);

    // 2. Live cloud attendance subscription (Cloud is the authoritative source of truth)
    const unsubAtt = subscribeCloudAttendance(
      (cloudAtt) => {
        const clean = (cloudAtt || []).filter(
          (r) => !['emp-shiva', 'emp-rajesh', 'emp-amit'].includes(r.employeeId)
        );
        const deduped = deduplicateAttendance(clean);
        // Always update state and localStorage with current cloud records, even if empty (after deletion)
        setAttendance(deduped);
        saveAttendance(deduped, uid);
      },
      (err: any) => {
        console.warn('Cloud attendance sync note:', err?.message || err);
        if (err?.message?.includes('Missing or insufficient permissions')) {
          setCloudSyncError('Firestore rules locked in Firebase Console');
        }
      },
      uid
    );

    // 3. Live cloud employees subscription (Cloud is the authoritative source of truth)
    const unsubEmps = subscribeCloudEmployees(
      (cloudEmps) => {
        const clean = (cloudEmps || []).filter(
          (e) => !['emp-shiva', 'emp-rajesh', 'emp-amit'].includes(e.id)
        );
        setEmployees(clean);
        saveEmployees(clean, uid);
      },
      (err: any) => {
        console.warn('Cloud employee sync note:', err?.message || err);
        if (err?.message?.includes('Missing or insufficient permissions')) {
          setCloudSyncError('Firestore rules locked in Firebase Console');
        }
      },
      uid
    );

    return () => {
      unsubEmps();
      unsubAtt();
    };
  }, [currentUser]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const handleSignOut = async () => {
    try {
      await signOutFirebase();
      showToast('Logged out successfully.');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  // Employees Map for quick name lookup
  const employeesMap = useMemo(() => {
    return new Map(employees.map((e) => [e.id, e]));
  }, [employees]);

  // Filtered attendance by Employee and Month
  const filteredAttendance = useMemo(() => {
    return attendance.filter((rec) => {
      const matchEmp = selectedEmployeeId === 'all' || rec.employeeId === selectedEmployeeId;
      const matchMonth = selectedMonth === 'all' || rec.date.startsWith(selectedMonth);
      return matchEmp && matchMonth;
    });
  }, [attendance, selectedEmployeeId, selectedMonth]);

  // Calculated summary based on active filters
  const summary = useMemo(() => {
    return calculateSummary(filteredAttendance);
  }, [filteredAttendance]);

  // Filter label for headers
  const filterLabel = useMemo(() => {
    const empName =
      selectedEmployeeId === 'all'
        ? 'All Employees'
        : employeesMap.get(selectedEmployeeId)?.name || 'Selected Employee';

    let monthName = 'All Time';
    if (selectedMonth !== 'all') {
      const parts = selectedMonth.split('-').map(Number);
      if (parts.length === 2) {
        const d = new Date(parts[0], parts[1] - 1, 1);
        monthName = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
    }

    return `${empName} · ${monthName}`;
  }, [selectedEmployeeId, selectedMonth, employeesMap]);

  // Handlers for Attendance
  const handleOpenNewAttendance = () => {
    if (employees.length === 0) {
      showToast('Pehle koi employee add karein.');
      setIsEmployeeModalOpen(true);
      return;
    }
    setEditingRecord(null);
    setIsAttendanceModalOpen(true);
  };

  const handleEditRecord = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setIsAttendanceModalOpen(true);
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('Delete this attendance entry?')) {
      const uid = currentUser?.uid;
      const updated = attendance.filter((r) => r.id !== id);
      setAttendance(updated);
      saveAttendance(updated, uid);
      deleteAttendanceFromCloud(id, uid).catch((err) => {
        console.warn('Firebase sync delete note:', err);
      });
      showToast('Attendance record deleted.');
    }
  };

  const handleSaveAttendance = (
    data: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>,
    recordId?: string
  ) => {
    const uid = currentUser?.uid;
    let updated: AttendanceRecord[];
    let savedRecord: AttendanceRecord;

    if (recordId) {
      // Edit existing by ID
      const existing = attendance.find((r) => r.id === recordId);
      savedRecord = {
        ...data,
        id: recordId,
        userId: uid,
        createdAt: existing?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      updated = attendance.map((r) => (r.id === recordId ? savedRecord : r));
      showToast('Attendance updated & synced.');
    } else {
      // Check if this employee already has an entry on this date
      const existingIndex = attendance.findIndex(
        (r) => r.employeeId === data.employeeId && r.date === data.date
      );

      if (existingIndex >= 0) {
        // Update existing record for this date instead of duplicate!
        const existing = attendance[existingIndex];
        savedRecord = {
          ...data,
          id: existing.id,
          userId: uid,
          createdAt: existing.createdAt || Date.now(),
          updatedAt: Date.now(),
        };
        updated = [...attendance];
        updated[existingIndex] = savedRecord;
        showToast('Shift for this date updated & synced.');
      } else {
        savedRecord = {
          ...data,
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          userId: uid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        updated = [savedRecord, ...attendance];
        showToast('Attendance saved & synced.');
      }
    }

    const cleanUpdated = deduplicateAttendance(updated);
    setAttendance(cleanUpdated);
    saveAttendance(cleanUpdated, uid);

    // Sync with Firebase in background with live feedback
    syncAttendanceToCloud(savedRecord, uid)
      .then(() => {
        setCloudSyncError(null);
        showToast('Shift saved & synced to Firebase ☁️');
      })
      .catch((err) => {
        console.warn('Firebase attendance save error:', err);
        setCloudSyncError(err?.message || 'Permission denied in Firebase Console');
        showToast('⚠️ Local save hua, par Cloud sync fail (Firebase Rules locked)');
      });
  };

  // Handlers for Employee Management
  const handleAddEmployee = (empData: Omit<Employee, 'id' | 'createdAt'>) => {
    const uid = currentUser?.uid;
    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: uid,
      createdAt: new Date().toISOString(),
    };
    const updated = [...employees, newEmp];
    setEmployees(updated);
    saveEmployees(updated, uid);
    syncEmployeeToCloud(newEmp, uid)
      .then(() => {
        setCloudSyncError(null);
        showToast(`Added & Synced: ${newEmp.name} ☁️`);
      })
      .catch((err) => {
        console.warn('Firebase employee sync error:', err);
        setCloudSyncError(err?.message || 'Permission denied in Firebase Console');
        showToast(`⚠️ Added locally, par Cloud sync fail (Firebase Rules locked)`);
      });
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    const uid = currentUser?.uid;
    const updated = employees.map((e) => (e.id === updatedEmp.id ? updatedEmp : e));
    setEmployees(updated);
    saveEmployees(updated, uid);
    syncEmployeeToCloud(updatedEmp, uid)
      .then(() => {
        setCloudSyncError(null);
        showToast(`Updated: ${updatedEmp.name} ☁️`);
      })
      .catch((err) => {
        console.warn('Firebase employee sync error:', err);
        setCloudSyncError(err?.message || 'Permission denied in Firebase Console');
      });
  };

  const handleDeleteEmployee = (id: string) => {
    const uid = currentUser?.uid;
    const updatedEmps = employees.filter((e) => e.id !== id);
    const updatedAtt = attendance.filter((r) => r.employeeId !== id);
    setEmployees(updatedEmps);
    saveEmployees(updatedEmps, uid);
    setAttendance(updatedAtt);
    saveAttendance(updatedAtt, uid);

    deleteEmployeeFromCloud(id, uid).catch((err) => {
      console.warn('Firebase delete employee error:', err);
    });

    if (selectedEmployeeId === id) {
      setSelectedEmployeeId('all');
    }
    showToast('Employee removed.');
  };

  // Cloud Sync Handlers
  const handleForceSyncToCloud = async () => {
    const uid = currentUser?.uid;
    setIsSyncing(true);
    setCloudSyncError(null);
    try {
      for (const emp of employees) {
        await syncEmployeeToCloud(emp, uid);
      }
      for (const rec of attendance) {
        await syncAttendanceToCloud(rec, uid);
      }
      showToast('All local records pushed to Firebase!');
    } catch (err: any) {
      console.error('Push to cloud error:', err);
      setCloudSyncError(err?.message || 'Permission denied or Firestore not enabled');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    const uid = currentUser?.uid;
    setIsSyncing(true);
    setCloudSyncError(null);
    try {
      const cloudData = await fetchAllFromCloud(uid);
      const cleanEmps = (cloudData.employees || []).filter(
        (e) => !['emp-shiva', 'emp-rajesh', 'emp-amit'].includes(e.id)
      );
      const cleanAtt = (cloudData.attendance || []).filter(
        (r) => !['emp-shiva', 'emp-rajesh', 'emp-amit'].includes(r.employeeId)
      );

      // Save to both Chrome memory and application state
      if (cleanEmps.length > 0) {
        setEmployees(cleanEmps);
        saveEmployees(cleanEmps, uid);
      }
      if (cleanAtt.length > 0) {
        const deduped = deduplicateAttendance(cleanAtt);
        setAttendance(deduped);
        saveAttendance(deduped, uid);
      }
      showToast(`Sync complete: ${cleanEmps.length} employees & ${cleanAtt.length} shifts from Cloud ☁️`);
    } catch (err: any) {
      console.error('Pull from cloud error:', err);
      setCloudSyncError(err?.message || 'Check Firestore rules');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    exportToCSV(filteredAttendance, employeesMap, filterLabel);
    showToast('CSV export downloaded.');
  };

  const handleExportJSON = () => {
    exportBackupJSON(employees, attendance);
    showToast('JSON backup file saved.');
  };

  const handleImportJSONClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uid = currentUser?.uid;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed && Array.isArray(parsed.employees) && Array.isArray(parsed.attendance)) {
          setEmployees(parsed.employees);
          saveEmployees(parsed.employees, uid);
          setAttendance(parsed.attendance);
          saveAttendance(parsed.attendance, uid);
          showToast(`Restored ${parsed.employees.length} employees & ${parsed.attendance.length} shifts.`);
          parsed.employees.forEach((emp: Employee) => syncEmployeeToCloud(emp, uid));
          parsed.attendance.forEach((rec: AttendanceRecord) => syncAttendanceToCloud(rec, uid));
        } else {
          alert('Invalid backup file.');
        }
      } catch (err) {
        alert('Could not parse backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAllData = () => {
    if (window.confirm('Kya aap sachme saara employee aur attendance data delete karna chahte hain?')) {
      const uid = currentUser?.uid;
      setEmployees([]);
      saveEmployees([], uid);
      setAttendance([]);
      saveAttendance([], uid);
      setSelectedEmployeeId('all');
      showToast('Saara data delete ho gaya.');
    }
  };

  // Auth checking splash
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center shadow-md animate-pulse">
            ST
          </div>
          <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Checking Login...</span>
        </div>
      </div>
    );
  }

  // Not signed in -> Show Google Login Screen
  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden w-full">
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Main App Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedEmployeeId={selectedEmployeeId}
        setSelectedEmployeeId={setSelectedEmployeeId}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        employees={employees}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onOpenNewRecord={handleOpenNewAttendance}
        onOpenRules={() => setIsRulesModalOpen(true)}
        onOpenFirebaseStatus={() => setIsFirebaseModalOpen(true)}
        onOpenAddEmployee={() => setIsEmployeeModalOpen(true)}
        isFirebaseConnected={isFirebaseConnected}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-4 left-4 sm:left-auto sm:right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-3 sm:py-6">
        {/* Cloud Sync Warning Banner if Firebase rules are blocking cross-browser sync */}
        {cloudSyncError && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-950 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Firebase Cloud Sync Alert:</strong> Data dusre browser (Chrome/Brave) me sync nahi ho raha? Firebase Console me Firestore Rules allow karein.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsFirebaseModalOpen(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition self-start sm:self-auto shrink-0 cursor-pointer text-xs shadow-2xs"
            >
              Fix Rules (1-Click Guide)
            </button>
          </div>
        )}

        {/* Onboarding State if no employees yet */}
        {employees.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-12 text-center max-w-md mx-auto my-6 sm:my-8 shadow-xs space-y-4">
            <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <UserPlus className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Koi Employee Add Nahi Hai
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pehle apna employee add karein. Uske baad aap unka daily clock-in / clock-out attendance record kar sakenge.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEmployeeModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add First Employee</span>
            </button>
          </div>
        ) : (
          <>
            {/* VIEW 1: Attendance Log (Default) */}
            {activeTab === 'attendance' && (
              <div>
                {/* Top Dashboard Summary Cards */}
                <SummaryCards summary={summary} filterLabel={filterLabel} />

                {/* Attendance Data Table */}
                <AttendanceTable
                  records={filteredAttendance}
                  employees={employees}
                  onEdit={handleEditRecord}
                  onDelete={handleDeleteRecord}
                  onExportCSV={handleExportCSV}
                />
              </div>
            )}

            {/* VIEW 2: Monthly Summary & Timesheet Statement */}
            {activeTab === 'summary' && (
              <MonthlyReportView
                records={filteredAttendance}
                employees={employees}
                selectedEmployeeId={selectedEmployeeId}
                selectedMonth={selectedMonth}
                onExportCSV={handleExportCSV}
              />
            )}

            {/* VIEW 3: Employees Management */}
            {activeTab === 'employees' && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex items-center justify-between shadow-xs">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
                      <span>Employee List ({employees.length})</span>
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                      Aapke dwara add kiye gaye sabhi workers ki list.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEmployeeModalOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Member</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {employees.map((emp) => {
                    const empRecords = attendance.filter((r) => r.employeeId === emp.id);
                    const totalBasic = empRecords.reduce((acc, r) => acc + r.basicHours, 0);
                    const totalOt = empRecords.reduce((acc, r) => acc + r.otHours, 0);

                    return (
                      <div
                        key={emp.id}
                        className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2.5 mb-3">
                            <div
                              className={`w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-xs shrink-0 ${
                                emp.avatarColor || 'bg-slate-700'
                              }`}
                            >
                              {emp.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">
                                {emp.name}
                              </h3>
                              <span className="text-xs text-slate-500">{emp.role}</span>
                            </div>
                          </div>

                          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 space-y-1 text-xs font-mono">
                            <div className="flex items-center justify-between text-slate-600">
                              <span>Shifts:</span>
                              <span className="font-semibold text-slate-900">{empRecords.length}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                              <span>Basic Hours:</span>
                              <span className="font-semibold text-slate-900">{totalBasic.toFixed(1)}h</span>
                            </div>
                            <div className="flex items-center justify-between text-amber-900">
                              <span>Overtime:</span>
                              <span className="font-bold">+{totalOt.toFixed(1)}h</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEmployeeId(emp.id);
                              setActiveTab('attendance');
                            }}
                            className="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline cursor-pointer"
                          >
                            View Shifts →
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEmployeeModalOpen(true)}
                            className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer & Data Storage Bar */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-3 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-semibold text-slate-800">ShiftTrack</span>
            <span>·</span>
            <button
              onClick={() => setIsFirebaseModalOpen(true)}
              className="inline-flex items-center gap-1.5 font-medium text-amber-800 hover:text-amber-950 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 cursor-pointer"
            >
              <Database className="w-3 h-3 text-amber-600" />
              <span>Cloud Sync</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </button>
            <span>·</span>
            <span>{employees.length} employees · {attendance.length} shifts</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-end">
            <button
              type="button"
              onClick={handleExportJSON}
              className="hover:text-slate-900 transition flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Backup</span>
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={handleImportJSONClick}
              className="hover:text-slate-900 transition flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Restore</span>
            </button>
            {employees.length > 0 && (
              <>
                <span>·</span>
                <button
                  type="button"
                  onClick={handleClearAllData}
                  className="hover:text-red-600 transition flex items-center gap-1 cursor-pointer text-slate-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AttendanceFormModal
        isOpen={isAttendanceModalOpen}
        onClose={() => {
          setIsAttendanceModalOpen(false);
          setEditingRecord(null);
        }}
        employees={employees}
        initialRecord={editingRecord}
        onSave={handleSaveAttendance}
        defaultEmployeeId={selectedEmployeeId}
        onOpenAddEmployee={() => setIsEmployeeModalOpen(true)}
      />

      <EmployeeManagerModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        employees={employees}
        attendanceRecords={attendance}
        onAddEmployee={handleAddEmployee}
        onUpdateEmployee={handleUpdateEmployee}
        onDeleteEmployee={handleDeleteEmployee}
        onSelectEmployeeForFilter={(id) => setSelectedEmployeeId(id)}
      />

      <RulesInfoModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      <FirebaseStatusModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        isConnected={isFirebaseConnected}
        isSyncing={isSyncing}
        cloudSyncError={cloudSyncError}
        employees={employees}
        attendance={attendance}
        currentUser={currentUser}
        onForceSyncToCloud={handleForceSyncToCloud}
        onPullFromCloud={handlePullFromCloud}
      />
    </div>
  );
}
