import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useListBusinesses } from "@workspace/api-client-react";
import { Search, Building2, BarChart3, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const INDUSTRIES = ["All", "Technology", "Healthcare", "Finance", "Retail", "Manufacturing"];

export default function Home() {
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("All");

  const { data: businesses, isLoading } = useListBusinesses({
    search: search || undefined,
    industry: industry !== "All" ? industry : undefined
  });

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-20 pb-28 border-b border-border/50">
        <div className="absolute inset-0 z-0 opacity-15">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Hero background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        </div>
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="purple" className="mb-6 py-1.5 px-4 text-sm shadow-sm backdrop-blur-md">
              <Sparkles className="mr-2 h-4 w-4" /> The future of business intelligence
            </Badge>
            <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight text-foreground mb-6">
              Turn raw data into<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                actionable insights.
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
              Explore public business metrics, discover growth trends, and ask AI anything about company performance in seconds.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="h-14 px-8 text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                Explore Businesses
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="h-14 px-8 text-base bg-background/50 backdrop-blur-sm">
                  Add Your Business
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Directory Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold text-foreground">Explore Directory</h2>
              <p className="text-muted-foreground mt-2">Discover analytics and insights from top companies.</p>
            </div>
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search businesses..." 
                  className="pl-10 h-11"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            {INDUSTRIES.map(ind => (
              <button
                key={ind}
                onClick={() => setIndustry(ind)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  industry === ind 
                    ? "bg-foreground text-background shadow-md" 
                    : "bg-background border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {ind}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-32 bg-muted/50 rounded-t-2xl" />
                  <CardContent className="p-6 space-y-4">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : businesses?.length === 0 ? (
            <div className="text-center py-24 bg-card rounded-3xl border border-border border-dashed">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No businesses found</h3>
              <p className="text-muted-foreground mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses?.map((business, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  key={business.id}
                >
                  <Link href={`/businesses/${business.id}`}>
                    <Card className="h-full cursor-pointer hover:-translate-y-1 transition-transform duration-300 group">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl ring-1 ring-primary/20">
                            {business.name.charAt(0)}
                          </div>
                          <Badge variant="secondary">{business.industry}</Badge>
                        </div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {business.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                          {business.description}
                        </CardDescription>
                      </CardContent>
                      <CardFooter className="pt-4 border-t border-border/50 flex gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <BarChart3 className="h-4 w-4" />
                          <span>{business.datasetCount || 0} datasets</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-4 w-4" />
                          <span>{business.insightCount || 0} insights</span>
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
