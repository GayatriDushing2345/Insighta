import { useState } from "react";
import { Redirect } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@workspace/replit-auth-web";
import { 
  useGetMyBusiness, 
  useCreateBusiness, 
  useUploadDataset, 
  useListDatasets, 
  useListInsights,
  useGenerateInsights,
  getGetMyBusinessQueryKey,
  getListDatasetsQueryKey,
  getListInsightsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, Building, FileSpreadsheet, Bot, ChevronRight, Activity, Clock } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const createBusinessSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  industry: z.string().min(2, "Industry is required"),
  description: z.string().min(10, "Description needs more detail"),
  website: z.string().url().optional().or(z.literal('')),
});

const uploadSchema = z.object({
  name: z.string().min(2, "Name is required"),
  fileType: z.enum(["csv", "json"]),
  data: z.string().min(10, "Data content is required"),
});

export default function Dashboard() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: myBusinessData, isLoading: isBusinessLoading } = useGetMyBusiness({
    query: { enabled: isAuthenticated }
  });

  const business = myBusinessData?.business;

  const { data: datasets } = useListDatasets(business?.id || 0, {
    query: { enabled: !!business?.id }
  });

  const { data: insights } = useListInsights(business?.id || 0, {
    query: { enabled: !!business?.id }
  });

  const createBusinessMutation = useCreateBusiness({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyBusinessQueryKey() });
        toast({ title: "Business Profile Created", description: "Your profile is ready." });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    }
  });

  const generateInsightsMutation = useGenerateInsights({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInsightsQueryKey(business?.id || 0) });
        toast({ title: "Insights Generated", description: "AI has successfully analyzed your new data." });
      }
    }
  });

  const uploadDatasetMutation = useUploadDataset({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDatasetsQueryKey(business?.id || 0) });
        toast({ title: "Dataset Uploaded", description: "Triggering AI insight generation..." });
        if (business?.id) {
          generateInsightsMutation.mutate({ id: business.id });
        }
        setIsUploadOpen(false);
        uploadForm.reset();
      },
      onError: (err: any) => {
        toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
      }
    }
  });

  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const businessForm = useForm<z.infer<typeof createBusinessSchema>>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: { name: "", industry: "", description: "", website: "" }
  });

  const uploadForm = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { name: "", fileType: "csv", data: "" }
  });

  const onBusinessSubmit = (values: z.infer<typeof createBusinessSchema>) => {
    createBusinessMutation.mutate({ data: values });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (typeof text === 'string') {
        uploadForm.setValue('data', text);
        uploadForm.setValue('fileType', file.name.endsWith('.json') ? 'json' : 'csv');
        if (!uploadForm.getValues('name')) {
          uploadForm.setValue('name', file.name.split('.')[0]);
        }
      }
    };
    reader.readAsText(file);
  };

  const onUploadSubmit = (values: z.infer<typeof uploadSchema>) => {
    if (!business?.id) return;
    uploadDatasetMutation.mutate({ id: business.id, data: values });
  };

  if (isAuthLoading || isBusinessLoading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return (
    <Layout>
      <div className="bg-background flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          
          {/* Create Business State */}
          {!business ? (
            <div className="max-w-2xl mx-auto mt-10">
              <div className="text-center mb-10">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 ring-8 ring-primary/5">
                  <Building className="h-8 w-8" />
                </div>
                <h1 className="text-4xl font-display font-bold text-foreground">Complete your profile</h1>
                <p className="mt-3 text-lg text-muted-foreground">
                  Create your business profile to start uploading datasets and generating AI insights.
                </p>
              </div>

              <Card className="p-8 shadow-xl border-border/60">
                <form onSubmit={businessForm.handleSubmit(onBusinessSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Company Name</label>
                    <Input {...businessForm.register("name")} placeholder="Acme Corp" />
                    {businessForm.formState.errors.name && (
                      <p className="text-sm text-destructive">{businessForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Industry</label>
                    <Input {...businessForm.register("industry")} placeholder="e.g. SaaS, Retail, FinTech" />
                    {businessForm.formState.errors.industry && (
                      <p className="text-sm text-destructive">{businessForm.formState.errors.industry.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <Textarea 
                      {...businessForm.register("description")} 
                      placeholder="What does your company do?"
                      className="h-32" 
                    />
                    {businessForm.formState.errors.description && (
                      <p className="text-sm text-destructive">{businessForm.formState.errors.description.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full text-base" 
                    isLoading={createBusinessMutation.isPending}
                  >
                    Create Business
                  </Button>
                </form>
              </Card>
            </div>
          ) : (
            /* Dashboard State */
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-display font-bold text-foreground">{business.name}</h1>
                  <p className="text-muted-foreground mt-1 flex items-center gap-2">
                    <Badge variant="secondary">{business.industry}</Badge>
                    Dashboard Overview
                  </p>
                </div>
                <Button onClick={() => setIsUploadOpen(true)} className="gap-2 shadow-md">
                  <Upload className="h-4 w-4" />
                  Upload Dataset
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Datasets</p>
                      <h3 className="text-2xl font-bold text-foreground">{business.datasetCount || 0}</h3>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                      <Bot className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">AI Insights</p>
                      <h3 className="text-2xl font-bold text-foreground">{business.insightCount || 0}</h3>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <Activity className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <h3 className="text-2xl font-bold text-foreground">Active</h3>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Datasets Panel */}
                <Card className="flex flex-col h-[500px]">
                  <CardHeader className="border-b border-border/50 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                      Recent Datasets
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-0">
                    {datasets?.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-foreground font-medium">No datasets yet</p>
                        <p className="text-sm text-muted-foreground mt-1 mb-4">Upload your first CSV or JSON file to generate insights.</p>
                        <Button variant="outline" size="sm" onClick={() => setIsUploadOpen(true)}>Upload Now</Button>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {datasets?.map(ds => (
                          <div key={ds.id} className="p-4 hover:bg-muted/30 transition-colors flex justify-between items-center">
                            <div>
                              <p className="font-medium text-foreground">{ds.name}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-[10px] py-0">{ds.fileType.toUpperCase()}</Badge>
                                <span>{ds.rowCount} rows</span>
                                <span>•</span>
                                <span>{format(new Date(ds.createdAt), 'MMM d, yyyy')}</span>
                              </div>
                            </div>
                            <Badge variant={ds.status === 'ready' ? 'success' : ds.status === 'failed' ? 'destructive' : 'warning'}>
                              {ds.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Insights Panel */}
                <Card className="flex flex-col h-[500px]">
                  <CardHeader className="border-b border-border/50 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-muted-foreground" />
                      Latest AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-0">
                    {insights?.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                          <Bot className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-foreground font-medium">No insights yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Upload data to trigger AI analysis automatically.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {insights?.map(insight => {
                          const badgeColor = {
                            summary: 'info', growth: 'success', risk: 'destructive', opportunity: 'warning', trend: 'purple'
                          }[insight.type] as any;
                          
                          return (
                            <div key={insight.id} className="p-4 hover:bg-muted/30 transition-colors">
                              <div className="flex justify-between items-start mb-2">
                                <Badge variant={badgeColor} className="capitalize">{insight.type}</Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(insight.createdAt), 'MMM d')}
                                </span>
                              </div>
                              <p className="font-semibold text-foreground mb-1">{insight.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-2">{insight.content}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Upload Modal */}
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen} title="Upload Dataset" description="Upload CSV or JSON files. AI will automatically analyze your data and generate new insights.">
            <form onSubmit={uploadForm.handleSubmit(onUploadSubmit)} className="space-y-6 mt-4">
              <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer relative">
                <input 
                  type="file" 
                  accept=".csv,.json" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                />
                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">Click to browse or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">CSV or JSON files only</p>
              </div>

              {uploadForm.watch('data') && (
                <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-emerald-600 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      File loaded successfully
                    </p>
                    <Badge variant="outline">{uploadForm.watch('fileType').toUpperCase()}</Badge>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Dataset Name</label>
                    <Input {...uploadForm.register("name")} placeholder="e.g. Q3 Sales Data" className="h-9" />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                <Button 
                  type="submit" 
                  disabled={!uploadForm.watch('data')} 
                  isLoading={uploadDatasetMutation.isPending || generateInsightsMutation.isPending}
                >
                  Upload & Analyze
                </Button>
              </div>
            </form>
          </Dialog>

        </div>
      </div>
    </Layout>
  );
}
