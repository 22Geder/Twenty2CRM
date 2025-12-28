'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, FileText, CheckCircle2, XCircle, Loader2, 
  MapPin, Briefcase, Tag, User, Mail, Phone, AlertCircle,
  FileCheck, FileX, ChevronDown, ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProcessedFile {
  name: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  progress: number;
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
}

export default function BulkUploadPage() {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

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

  const processFiles = async () => {
    setIsProcessing(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'pending') continue;

      // Update to processing
      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'processing' as const, progress: 0 } : f
      ));

      try {
        const originalFile = rawFiles[i];
        if (!originalFile) {
          throw new Error('הקובץ לא נמצא לעיבוד');
        }

        setFiles(prev => prev.map((f, idx) => (idx === i ? { ...f, progress: 10 } : f)));

        const formData = new FormData();
        formData.append('file', originalFile);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        setFiles(prev => prev.map((f, idx) => (idx === i ? { ...f, progress: 80 } : f)));

        const data = await response.json();
        if (!response.ok || !data?.success) {
          throw new Error(data?.error || 'שגיאה בעיבוד הקובץ');
        }

        setFiles(prev => prev.map((f, idx) =>
          idx === i
            ? {
                ...f,
                status: 'success' as const,
                progress: 100,
                candidate: data.candidate,
              }
            : f
        ));

        // notify candidates list to refetch
        window.dispatchEvent(new Event('candidates-updated'));

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

  const stats = {
    total: files.length,
    success: files.filter(f => f.status === 'success').length,
    error: files.filter(f => f.status === 'error').length,
    pending: files.filter(f => f.status === 'pending').length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">העלאת קורות חיים המונית</h1>
        <p className="text-gray-600">העלה עד 500 קורות חיים - המערכת תקרא ותנתח אוטומטית (PDF, DOCX, תמונות)</p>
      </div>

      {/* Stats Cards */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">סך הכל</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <FileText className="h-10 w-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">הצליחו</p>
                  <p className="text-3xl font-bold text-green-900">{stats.success}</p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">כשלו</p>
                  <p className="text-3xl font-bold text-red-900">{stats.error}</p>
                </div>
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">ממתינים</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.pending}</p>
                </div>
                <Loader2 className="h-10 w-10 text-orange-600" />
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
                        מעבד...
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

      {/* Files List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>קבצים שהועלו</CardTitle>
            <CardDescription>לחץ על קובץ לצפייה במידע שחולץ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  {/* File Header */}
                  <div 
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setExpandedFile(expandedFile === file.name ? null : file.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {file.status === 'pending' && <FileText className="h-5 w-5 text-gray-400" />}
                        {file.status === 'processing' && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
                        {file.status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                        {file.status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
                        
                        <div className="flex-1">
                          <p className="font-medium">{file.name}</p>
                          {file.status === 'processing' && (
                            <div className="mt-1">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${file.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          {file.error && (
                            <p className="text-sm text-red-600 mt-1">{file.error}</p>
                          )}
                        </div>
                      </div>

                      {file.candidate && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {file.candidate.currentTitle}
                          </Badge>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {file.candidate.city}
                          </Badge>
                          {expandedFile === file.name ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedFile === file.name && file.candidate && (
                    <div className="px-4 pb-4 bg-gray-50 border-t">
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

                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-gray-500 mt-1" />
                            <div>
                              <p className="text-xs text-gray-500">ניסיון</p>
                              <p className="font-medium">{file.candidate.experience}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Tag className="h-4 w-4 text-gray-500 mt-1" />
                            <div>
                              <p className="text-xs text-gray-500 mb-1">מיומנויות</p>
                              <div className="flex flex-wrap gap-1">
                                {file.candidate.skills.map((skill, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Briefcase className="h-4 w-4 text-green-600 mt-1" />
                            <div>
                              <p className="text-xs text-gray-500 mb-1">משרות מותאמות אוטומטית</p>
                              <div className="space-y-1">
                                {file.candidate.matchedPositions.map((pos, idx) => (
                                  <Badge 
                                    key={idx} 
                                    className={pos === 'ללא התאמה אוטומטית' 
                                      ? 'bg-gray-100 text-gray-600' 
                                      : 'bg-green-100 text-green-800 border-green-200'}
                                  >
                                    {pos}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {stats.success > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg mb-1">✅ עיבוד הושלם בהצלחה!</h3>
                <p className="text-sm text-gray-600">
                  {stats.success} מועמדים חדשים מוכנים להתווסף למערכת
                </p>
              </div>
              <Button 
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                onClick={() => {
                  alert(`${stats.success} מועמדים יתווספו למערכת!\n\nבאפליקציה אמיתית הם יישמרו ב-DB עם כל המידע שחולץ.`);
                }}
              >
                <CheckCircle2 className="h-5 w-5 ml-2" />
                הוסף {stats.success} מועמדים למערכת
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
