'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, FileText, CheckCircle2, XCircle, Loader2, 
  MapPin, Briefcase, Tag, User, Mail, Phone, AlertCircle,
  FileCheck, FileX, ChevronDown, ChevronUp, Edit3, SkipForward,
  AlertTriangle, ThumbsUp, ThumbsDown, Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface DataQuality {
  hasName: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  hasCity: boolean;
  hasTitle: boolean;
  hasSkills: boolean;
  confidence: { name: number; phone: number; email: number; city: number };
}

interface ProcessedFile {
  name: string;
  status: 'pending' | 'processing' | 'needs-confirm' | 'success' | 'error' | 'skipped';
  progress: number;
  candidateId?: string;  // 🆕 ID לעריכה
  candidate?: {
    name: string;
    email: string;
    phone: string;
    city: string;
    currentTitle: string;
    skills: string[];
    experience: string;
    matchedPositions: string[];
  };
  error?: string;
  qualityScore?: number;
  dataQuality?: DataQuality;
  extractedText?: string;
  aiExtracted?: boolean;
}

export default function BulkUploadPage() {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Record<string, any>>({});

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setRawFiles(prev => [...prev, ...acceptedFiles]);
    const newFiles: ProcessedFile[] = acceptedFiles.map(file => ({
      name: file.name,
      status: 'pending' as const,
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 500
  });

  // 🆕 שלב 1: בדיקה ראשונית של כל הקבצים
  const processFiles = async () => {
    setIsProcessing(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'pending') continue;

      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'processing' as const, progress: 0 } : f
      ));

      try {
        const originalFile = rawFiles[i];
        if (!originalFile) {
          throw new Error('הקובץ לא נמצא לעיבוד');
        }

        setFiles(prev => prev.map((f, idx) => (idx === i ? { ...f, progress: 30 } : f)));

        // 🆕 שלב ראשון: בדיקה בלבד (confirmOnly)
        const formData = new FormData();
        formData.append('file', originalFile);
        formData.append('confirmOnly', 'true');

        const checkResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        setFiles(prev => prev.map((f, idx) => (idx === i ? { ...f, progress: 60 } : f)));

        const checkData = await checkResponse.json();
        if (!checkResponse.ok) {
          throw new Error(checkData?.error || 'שגיאה בקריאת הקובץ');
        }

        // בדיקת איכות הנתונים
        if (checkData.needsConfirmation || checkData.qualityScore < 50) {
          // 🆕 הקובץ דורש אישור - לא נקלט כראוי
          setFiles(prev => prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: 'needs-confirm' as const,
                  progress: 100,
                  candidate: checkData.candidate,
                  qualityScore: checkData.qualityScore,
                  dataQuality: checkData.dataQuality,
                  extractedText: checkData.extractedText,
                  aiExtracted: checkData.aiExtracted
                }
              : f
          ));
        } else {
          // הקובץ נקלט טוב - שמור אותו
          const saveFormData = new FormData();
          saveFormData.append('file', originalFile);
          
          const saveResponse = await fetch('/api/upload', {
            method: 'POST',
            body: saveFormData,
          });
          
          const saveData = await saveResponse.json();
          if (!saveResponse.ok || !saveData?.success) {
            throw new Error(saveData?.error || 'שגיאה בשמירת הקובץ');
          }

          setFiles(prev => prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: 'success' as const,
                  progress: 100,
                  candidate: saveData.candidate,
                  candidateId: saveData.candidateId,  // 🆕 שמירת ID לעריכה
                  qualityScore: checkData.qualityScore,
                  dataQuality: checkData.dataQuality,
                  aiExtracted: checkData.aiExtracted
                }
              : f
          ));

          window.dispatchEvent(new Event('candidates-updated'));
        }

      } catch (error) {
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { 
            ...f, 
            status: 'error' as const, 
            error: error instanceof Error ? error.message : 'שגיאה בעיבוד הקובץ'
          } : f
        ));
      }
    }

    setIsProcessing(false);
  };

  // 🆕 אישור והוספת מועמד
  const confirmAndAdd = async (fileName: string) => {
    const fileIndex = files.findIndex(f => f.name === fileName);
    if (fileIndex === -1) return;

    const originalFile = rawFiles[fileIndex];
    if (!originalFile) return;

    setFiles(prev => prev.map((f, idx) => 
      idx === fileIndex ? { ...f, status: 'processing' as const, progress: 50 } : f
    ));

    try {
      const formData = new FormData();
      formData.append('file', originalFile);
      
      // אם יש נתונים ערוכים, שלח אותם
      if (editedData[fileName]) {
        formData.append('editedData', JSON.stringify(editedData[fileName]));
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'שגיאה בשמירת המועמד');
      }

      setFiles(prev => prev.map((f, idx) =>
        idx === fileIndex
          ? { ...f, status: 'success' as const, progress: 100, candidate: data.candidate, candidateId: data.candidateId }
          : f
      ));

      window.dispatchEvent(new Event('candidates-updated'));
      setEditingFile(null);
      
    } catch (error) {
      setFiles(prev => prev.map((f, idx) => 
        idx === fileIndex ? { 
          ...f, 
          status: 'error' as const, 
          error: error instanceof Error ? error.message : 'שגיאה'
        } : f
      ));
    }
  };

  // 🆕 דלג על קובץ
  const skipFile = (fileName: string) => {
    setFiles(prev => prev.map(f => 
      f.name === fileName ? { ...f, status: 'skipped' as const } : f
    ));
  };

  // 🆕 התחל עריכה
  const startEditing = (fileName: string, candidate: any) => {
    setEditingFile(fileName);
    setEditedData(prev => ({
      ...prev,
      [fileName]: { ...candidate }
    }));
  };

  // 🆕 שמור עריכת מועמד
  const saveEditedCandidate = async (fileName: string) => {
    const file = files.find(f => f.name === fileName);
    if (!file?.candidateId) return;

    const data = editedData[fileName];
    if (!data) return;

    try {
      const response = await fetch(`/api/candidates/${file.candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          city: data.city,
          currentTitle: data.currentTitle,
        }),
      });

      if (!response.ok) throw new Error('שגיאה בשמירה');

      // עדכון הרשימה עם הנתונים החדשים
      setFiles(prev => prev.map(f => 
        f.name === fileName 
          ? { ...f, candidate: { ...f.candidate!, ...data } }
          : f
      ));

      setEditingFile(null);
      window.dispatchEvent(new Event('candidates-updated'));
    } catch (error) {
      console.error('Save error:', error);
      alert('שגיאה בשמירת העריכה');
    }
  };

  const stats = {
    total: files.length,
    success: files.filter(f => f.status === 'success').length,
    error: files.filter(f => f.status === 'error').length,
    pending: files.filter(f => f.status === 'pending').length,
    needsConfirm: files.filter(f => f.status === 'needs-confirm').length,
    skipped: files.filter(f => f.status === 'skipped').length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">📄 העלאת קורות חיים המונית + AI</h1>
        <p className="text-gray-600">העלה עד 500 קורות חיים - המערכת תקרא עם Gemini AI ותנתח אוטומטית</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">📄 PDF (רגיל + סרוק!)</span>
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">📝 DOCX</span>
          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">🖼️ תמונות OCR</span>
          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">🤖 Gemini Vision AI</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">✨ חדש! המערכת קוראת גם קבצי PDF סרוקים (תמונה בתוך PDF) באמצעות Gemini Vision</p>
      </div>

      {/* Stats Cards */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-xs text-blue-600 font-medium">סך הכל</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-xs text-green-600 font-medium">✅ הצליחו</p>
                <p className="text-2xl font-bold text-green-900">{stats.success}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-xs text-amber-600 font-medium">⚠️ לאישור</p>
                <p className="text-2xl font-bold text-amber-900">{stats.needsConfirm}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-xs text-red-600 font-medium">❌ כשלו</p>
                <p className="text-2xl font-bold text-red-900">{stats.error}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium">⏭️ דולגו</p>
                <p className="text-2xl font-bold text-gray-900">{stats.skipped}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-xs text-orange-600 font-medium">⏳ ממתינים</p>
                <p className="text-2xl font-bold text-orange-900">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Area */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
        <CardContent className="pt-6">
          <div
            {...getRootProps()}
            className={`p-12 text-center cursor-pointer transition-all ${
              isDragActive ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className={`h-16 w-16 mx-auto mb-4 ${isDragActive ? 'text-blue-600' : 'text-gray-400'}`} />
            
            {isDragActive ? (
              <p className="text-xl font-semibold text-blue-600">שחרר את הקבצים כאן...</p>
            ) : (
              <>
                <p className="text-xl font-semibold mb-2">גרור קבצים לכאן או לחץ לבחירה</p>
                <p className="text-gray-500 mb-4">תומך ב-PDF, DOCX, DOC, PNG, JPG</p>
                <p className="text-sm text-gray-400">ניתן להעלות עד 500 קבצים בבת אחת</p>
              </>
            )}

            {files.length > 0 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {files.length} קבצים נבחרו
                </Badge>
                
                {stats.pending > 0 && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      processFiles();
                    }}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        מעבד עם AI...
                      </>
                    ) : (
                      <>
                        <FileCheck className="h-4 w-4 ml-2" />
                        התחל עיבוד ({stats.pending})
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 🆕 Files Needing Confirmation */}
      {stats.needsConfirm > 0 && (
        <Card className="border-2 border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              קבצים שדורשים אישור ({stats.needsConfirm})
            </CardTitle>
            <CardDescription>
              הקבצים הבאים לא נקלטו במלואם. בדוק את המידע ואשר או דלג.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.filter(f => f.status === 'needs-confirm').map((file, index) => (
                <div key={index} className="border-2 border-amber-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <span className="font-medium">{file.name}</span>
                      {file.aiExtracted && (
                        <Badge className="bg-purple-100 text-purple-700">AI קרא</Badge>
                      )}
                      <Badge className="bg-amber-100 text-amber-700">
                        איכות: {file.qualityScore}%
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedFile(expandedFile === file.name ? null : file.name)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {expandedFile === file.name ? 'הסתר' : 'הצג טקסט'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-gray-600"
                        onClick={() => skipFile(file.name)}
                      >
                        <SkipForward className="h-4 w-4 mr-1" />
                        דלג
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => confirmAndAdd(file.name)}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        הוסף בכל זאת
                      </Button>
                    </div>
                  </div>

                  {/* מה נקלט */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                    <div className={`p-2 rounded ${file.dataQuality?.hasName ? 'bg-green-100' : 'bg-red-100'}`}>
                      <span className="text-gray-600">שם:</span>
                      <p className="font-medium truncate">{file.candidate?.name || 'לא זוהה'}</p>
                    </div>
                    <div className={`p-2 rounded ${file.dataQuality?.hasPhone ? 'bg-green-100' : 'bg-red-100'}`}>
                      <span className="text-gray-600">טלפון:</span>
                      <p className="font-medium truncate">{file.candidate?.phone || 'לא זוהה'}</p>
                    </div>
                    <div className={`p-2 rounded ${file.dataQuality?.hasEmail ? 'bg-green-100' : 'bg-red-100'}`}>
                      <span className="text-gray-600">אימייל:</span>
                      <p className="font-medium truncate">{file.candidate?.email || 'לא זוהה'}</p>
                    </div>
                    <div className={`p-2 rounded ${file.dataQuality?.hasCity ? 'bg-green-100' : 'bg-red-100'}`}>
                      <span className="text-gray-600">עיר:</span>
                      <p className="font-medium truncate">{file.candidate?.city || 'לא זוהה'}</p>
                    </div>
                    <div className={`p-2 rounded ${file.dataQuality?.hasTitle ? 'bg-green-100' : 'bg-red-100'}`}>
                      <span className="text-gray-600">תפקיד:</span>
                      <p className="font-medium truncate">{file.candidate?.currentTitle || 'לא זוהה'}</p>
                    </div>
                  </div>

                  {/* הצגת טקסט שחולץ */}
                  {expandedFile === file.name && file.extractedText && (
                    <div className="mt-3 p-3 bg-gray-100 rounded text-xs max-h-40 overflow-auto">
                      <p className="font-medium mb-1">טקסט שחולץ מהקובץ:</p>
                      <pre className="whitespace-pre-wrap text-gray-700">{file.extractedText}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>כל הקבצים</CardTitle>
            <CardDescription>לחץ על קובץ לצפייה במידע שחולץ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.filter(f => f.status !== 'needs-confirm').map((file, index) => (
                <div key={index} className={`border rounded-lg overflow-hidden ${
                  file.status === 'skipped' ? 'opacity-50' : ''
                }`}>
                  {/* File Header */}
                  <div 
                    className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setExpandedFile(expandedFile === file.name ? null : file.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {file.status === 'pending' && <FileText className="h-5 w-5 text-gray-400" />}
                        {file.status === 'processing' && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
                        {file.status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                        {file.status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
                        {file.status === 'skipped' && <SkipForward className="h-5 w-5 text-gray-400" />}
                        
                        <div className="flex-1">
                          <p className="font-medium text-sm">{file.name}</p>
                          {file.status === 'processing' && (
                            <div className="mt-1">
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${file.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          {file.error && (
                            <p className="text-xs text-red-600 mt-1">{file.error}</p>
                          )}
                        </div>
                      </div>

                      {file.candidate && file.status === 'success' && (
                        <div className="flex items-center gap-2">
                          {file.aiExtracted && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs">🤖 AI</Badge>
                          )}
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                            {file.candidate.currentTitle}
                          </Badge>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                            {file.candidate.city}
                          </Badge>
                          {/* 🆕 כפתור עריכה */}
                          {file.candidateId && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(file.name, file.candidate);
                                setExpandedFile(file.name);
                              }}
                            >
                              <Edit3 className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                          {expandedFile === file.name ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedFile === file.name && file.candidate && (
                    <div className="px-4 pb-4 bg-gray-50 border-t">
                      {/* 🆕 מצב עריכה */}
                      {editingFile === file.name ? (
                        <div className="space-y-4 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div className="flex items-start gap-2">
                                <User className="h-4 w-4 text-gray-500 mt-2" />
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500 mb-1">שם מלא</p>
                                  <Input
                                    value={editedData[file.name]?.name || ''}
                                    onChange={(e) => setEditedData(prev => ({
                                      ...prev,
                                      [file.name]: { ...prev[file.name], name: e.target.value }
                                    }))}
                                    className="h-9"
                                  />
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <Mail className="h-4 w-4 text-gray-500 mt-2" />
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500 mb-1">אימייל</p>
                                  <Input
                                    value={editedData[file.name]?.email || ''}
                                    onChange={(e) => setEditedData(prev => ({
                                      ...prev,
                                      [file.name]: { ...prev[file.name], email: e.target.value }
                                    }))}
                                    className="h-9"
                                  />
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <Phone className="h-4 w-4 text-gray-500 mt-2" />
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500 mb-1">טלפון</p>
                                  <Input
                                    value={editedData[file.name]?.phone || ''}
                                    onChange={(e) => setEditedData(prev => ({
                                      ...prev,
                                      [file.name]: { ...prev[file.name], phone: e.target.value }
                                    }))}
                                    className="h-9"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-gray-500 mt-2" />
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500 mb-1">עיר</p>
                                  <Input
                                    value={editedData[file.name]?.city || ''}
                                    onChange={(e) => setEditedData(prev => ({
                                      ...prev,
                                      [file.name]: { ...prev[file.name], city: e.target.value }
                                    }))}
                                    className="h-9"
                                  />
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <Briefcase className="h-4 w-4 text-gray-500 mt-2" />
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500 mb-1">תפקיד נוכחי</p>
                                  <Input
                                    value={editedData[file.name]?.currentTitle || ''}
                                    onChange={(e) => setEditedData(prev => ({
                                      ...prev,
                                      [file.name]: { ...prev[file.name], currentTitle: e.target.value }
                                    }))}
                                    className="h-9"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* כפתורי שמירה/ביטול */}
                          <div className="flex gap-2 justify-end pt-2 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingFile(null)}
                            >
                              ביטול
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => saveEditedCandidate(file.name)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              שמור
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* מצב תצוגה רגיל */
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <User className="h-4 w-4 text-gray-500 mt-1" />
                              <div>
                                <p className="text-xs text-gray-500">שם מלא</p>
                                <p className="font-medium">{file.candidate.name}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <Mail className="h-4 w-4 text-gray-500 mt-1" />
                              <div>
                                <p className="text-xs text-gray-500">אימייל</p>
                                <p className="font-medium">{file.candidate.email}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <Phone className="h-4 w-4 text-gray-500 mt-1" />
                              <div>
                                <p className="text-xs text-gray-500">טלפון</p>
                                <p className="font-medium">{file.candidate.phone}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                              <div>
                                <p className="text-xs text-gray-500">עיר</p>
                                <p className="font-medium">{file.candidate.city}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <Briefcase className="h-4 w-4 text-gray-500 mt-1" />
                              <div>
                                <p className="text-xs text-gray-500">תפקיד נוכחי</p>
                                <p className="font-medium">{file.candidate.currentTitle}</p>
                              </div>
                            </div>

                            {file.candidate.skills && file.candidate.skills.length > 0 && (
                              <div className="flex items-start gap-2">
                                <Tag className="h-4 w-4 text-gray-500 mt-1" />
                                <div>
                                  <p className="text-xs text-gray-500">כישורים</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {file.candidate.skills.slice(0, 5).map((skill, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {skill}
                                      </Badge>
                                    ))}
                                    {file.candidate.skills.length > 5 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{file.candidate.skills.length - 5}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
