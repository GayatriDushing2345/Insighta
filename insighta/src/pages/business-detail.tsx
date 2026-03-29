import { useState } from "react";
import { useRoute } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { 
  useGetBusinessById, 
  useListQueries, 
  useAskBusinessQuestion,
  getListQueriesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Building2, Globe, Calendar, Bot, TrendingUp, ShieldAlert, 
  Lightbulb, FileText, MessageSquare, Send, Sparkles 
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";

// Mock data for the beautiful visual chart if datasets exist
const mockChartData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 4500 },
  { name: 'May', value: 6000 },
  { name: 'Jun', value: 5500 },
];

export default function BusinessDetail() {
  const [, params] = useRoute("/businesses/:id");
  const businessId = parseInt(params?.id || "0", 10);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"insights" | "datasets" | "qa">("insights");
  const [question, setQuestion] = useState("");

  const { data: businessDetail, isLoading, error } = useGetBusinessById(businessId);
  const { data: queries } = useListQueries(businessId, { query: { enabled: activeTab === 'qa' && !!businessId } });

  const askMutation = useAskBusinessQuestion({
    mutation: {
      onSuccess: () => {
        setQuestion("");
        queryClient.invalidateQueries({ queryKey: getListQueriesQueryKey(businessId) });
      }
    }
  });

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !businessId) return;
    askMutation.mutate({ id: businessId, data: { question } });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !businessDetail) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-2xl font-bold text-foreground">Business Not Found</h2>
          <p className="text-muted-foreground mt-2">The business profile you're looking for doesn't exist.</p>
        </div>
      </Layout>
    );
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'growth': return <TrendingUp className="h-5 w-5 text-emerald-500" />;
      case 'risk': return <ShieldAlert className="h-5 w-5 text-destructive" />;
      case 'opportunity': return <Lightbulb className="h-5 w-5 text-amber-500" />;
      case 'summary': return <FileText className="h-5 w-5 text-blue-500" />;
      default: return <Sparkles className="h-5 w-5 text-purple-500" />;
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'growth': return 'success';
      case 'risk': return 'destructive';
      case 'opportunity': return 'warning';
      case 'summary': return 'info';
      default: return 'purple';
    }
  };

  return (
    <Layout>
      {/* Header Profile Section */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-4xl font-display font-bold text-primary shadow-inner border border-primary/10">
              {businessDetail.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-display font-bold text-foreground">{businessDetail.name}</h1>
                <Badge variant="secondary" className="text-sm py-0.5">{businessDetail.industry}</Badge>
              </div>
              <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
                {businessDetail.description}
              </p>
              <div className="flex gap-6 mt-4 text-sm text-muted-foreground">
                {businessDetail.website && (
                  <div className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                    <Globe className="h-4 w-4" />
                    <span>{businessDetail.website}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {format(new Date(businessDetail.createdAt), 'MMM yyyy')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-border/50 pb-[1px] mb-8 overflow-x-auto scrollbar-hide">
          {[
            { id: 'insights', label: 'AI Insights', icon: Sparkles },
            { id: 'datasets', label: 'Data Sources', icon: FileText },
            { id: 'qa', label: 'Ask AI', icon: MessageSquare }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'insights' && (
              <div className="space-y-8">
                {/* Visual Chart if there's data */}
                {businessDetail.datasets.length > 0 && (
                  <Card className="overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-border/50 bg-muted/10">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" /> 
                        Performance Metrics Proxy
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">Simulated visualization based on processed dataset density.</p>
                    </div>
                    <div className="h-[300px] w-full p-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))'}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {businessDetail.insights.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-muted/20 rounded-2xl border border-dashed border-border">
                      <Bot className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                      <p className="text-foreground font-medium">No insights generated yet</p>
                      <p className="text-sm text-muted-foreground mt-1">The owner needs to upload data to generate insights.</p>
                    </div>
                  ) : (
                    businessDetail.insights.map(insight => (
                      <Card key={insight.id} className="h-full hover:shadow-lg transition-shadow bg-gradient-to-b from-background to-muted/10">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="p-2.5 rounded-xl bg-background shadow-sm border border-border/50">
                              {getInsightIcon(insight.type)}
                            </div>
                            <Badge variant={getBadgeVariant(insight.type) as any} className="capitalize">
                              {insight.type}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-bold text-foreground mb-2 leading-tight">{insight.title}</h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">{insight.content}</p>
                          {insight.metrics && (
                            <div className="mt-4 pt-4 border-t border-border/50">
                              <p className="text-xs font-mono text-foreground bg-muted p-2 rounded-md">{insight.metrics}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'datasets' && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Public Datasets</h3>
                  {businessDetail.datasets.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center">No public datasets available.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                          <tr>
                            <th className="px-4 py-3 rounded-tl-lg">Name</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Rows</th>
                            <th className="px-4 py-3 rounded-tr-lg">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {businessDetail.datasets.map((ds) => (
                            <tr key={ds.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                              <td className="px-4 py-4 font-medium text-foreground">{ds.name}</td>
                              <td className="px-4 py-4">
                                <Badge variant="outline" className="text-[10px]">{ds.fileType.toUpperCase()}</Badge>
                              </td>
                              <td className="px-4 py-4 text-muted-foreground">{ds.rowCount.toLocaleString()}</td>
                              <td className="px-4 py-4 text-muted-foreground">{format(new Date(ds.createdAt), 'MMM d, yyyy')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {activeTab === 'qa' && (
              <div className="flex flex-col h-[600px] border border-border bg-card rounded-2xl shadow-sm overflow-hidden relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--muted-foreground)/0.1)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-50" />
                
                <div className="p-4 border-b border-border bg-card/80 backdrop-blur-sm z-10">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground leading-none">Insighta AI Analyst</h3>
                      <p className="text-xs text-muted-foreground mt-1">Ask questions based on {businessDetail.name}'s data</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 z-10">
                  {queries?.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
                      <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-foreground font-medium">Start the conversation</p>
                      <p className="text-sm text-muted-foreground">Try asking "What are the main growth drivers?"</p>
                    </div>
                  ) : (
                    queries?.map(q => (
                      <div key={q.id} className="space-y-4">
                        {/* User Bubble */}
                        <div className="flex justify-end">
                          <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm">
                            <p className="text-sm">{q.question}</p>
                          </div>
                        </div>
                        {/* AI Bubble */}
                        <div className="flex justify-start">
                          <div className="bg-muted text-foreground px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%] border border-border shadow-sm">
                            <p className="text-sm leading-relaxed">{q.answer}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {askMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-muted text-foreground px-4 py-4 rounded-2xl rounded-tl-sm border border-border shadow-sm flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce delay-100" />
                          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-card/80 backdrop-blur-md border-t border-border z-10">
                  <form onSubmit={handleAsk} className="relative flex items-center">
                    <Input 
                      placeholder="Ask anything about the data..." 
                      className="pr-12 h-12 bg-background border-border shadow-inner rounded-xl"
                      value={question}
                      onChange={e => setQuestion(e.target.value)}
                      disabled={askMutation.isPending}
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="absolute right-1.5 h-9 w-9 rounded-lg"
                      disabled={!question.trim() || askMutation.isPending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Layout>
  );
}
