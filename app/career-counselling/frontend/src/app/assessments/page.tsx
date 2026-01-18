"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layout, BrainCircuit, ArrowRight, CheckCircle } from "lucide-react";

export default function AssessmentsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
            Career Assessments
          </h1>
          <p className="mt-4 text-gray-600 max-w-3xl mx-auto">
            Discover your strengths, interests, and potential career paths with our scientifically validated assessment tools.
            These assessments will help you make informed decisions about your educational and professional journey.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* RIASEC Assessment Card */}
          <Card className="shadow-md hover:shadow-lg transition-shadow border-t-4 border-t-blue-500">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl text-blue-800">RIASEC Assessment</CardTitle>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Available</Badge>
              </div>
              <CardDescription>Holland Code Personality Test</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                The RIASEC test helps identify your interests and how they relate to different careers.
                It measures six personality types: Realistic, Investigative, Artistic, Social, Enterprising, and Conventional.
              </p>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Time: 5-7 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Questions: 30</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Get instant results</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/assessments/riasec" className="w-full">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Take Assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
          
          {/* Coming Soon Assessment Cards */}
          {['Multiple Intelligence', 'Big Five Personality', 'Career Values'].map((test, index) => (
            <Card key={index} className="shadow-md border-t-4 border-t-gray-300 opacity-80">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl text-gray-600">{test}</CardTitle>
                  <Badge variant="outline" className="bg-gray-100 text-gray-600">Coming Soon</Badge>
                </div>
                <CardDescription>Personality Assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  This assessment will help you understand your personality traits, strengths, and potential career paths
                  that match your unique profile.
                </p>
                
                <div className="mt-4 space-y-2 text-gray-400">
                  <div className="flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    <span className="text-sm">Multiple dimensions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4" />
                    <span className="text-sm">Comprehensive insights</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button disabled className="w-full bg-gray-400 cursor-not-allowed">
                  Coming Soon
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">More Assessments Coming Soon</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We're constantly working on new assessments to help you discover more about yourself and your career potential.
            Check back soon for updates!
          </p>
        </div>
      </div>
    </div>
  );
}