import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { applyTrademarks, validateProjectDescription } from "@/lib/trademark-utils";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function TrademarkUpdater() {
  const [status, setStatus] = useState<string>('');
  const [issues, setIssues] = useState<string[]>([]);

  const updateAllProjects = () => {
    try {
      // Get current projects from localStorage
      const projectsData = localStorage.getItem('adminProjects');
      if (!projectsData) {
        setStatus('No projects found to update');
        return;
      }

      const projects = JSON.parse(projectsData);
      let updatedCount = 0;
      const allIssues: string[] = [];

      // Update each project
      const updatedProjects = projects.map((project: any) => {
        const titleValidation = validateProjectDescription(project.title);
        const descValidation = validateProjectDescription(project.description);

        if (!titleValidation.isValid || !descValidation.isValid) {
          updatedCount++;
          allIssues.push(...titleValidation.issues, ...descValidation.issues);
        }

        return {
          ...project,
          title: titleValidation.corrected,
          description: descValidation.corrected
        };
      });

      // Save updated projects
      localStorage.setItem('adminProjects', JSON.stringify(updatedProjects));
      
      setStatus(`Updated ${updatedCount} projects with proper trademark symbols`);
      setIssues([...new Set(allIssues)]); // Remove duplicates

      // If using the API, also update there
      if (window.location.origin.includes('localhost') || window.location.origin.includes('replit')) {
        fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projects: updatedProjects })
        });
      }

    } catch (error) {
      setStatus('Error updating projects: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const previewChanges = () => {
    const projectsData = localStorage.getItem('adminProjects');
    if (!projectsData) {
      setStatus('No projects found');
      return;
    }

    const projects = JSON.parse(projectsData);
    const preview: string[] = [];

    projects.forEach((project: any, index: number) => {
      const titleValidation = validateProjectDescription(project.title);
      const descValidation = validateProjectDescription(project.description);

      if (!titleValidation.isValid || !descValidation.isValid) {
        preview.push(`Project ${index + 1}:`);
        if (project.title !== titleValidation.corrected) {
          preview.push(`  Title: "${project.title}" → "${titleValidation.corrected}"`);
        }
        if (project.description !== descValidation.corrected) {
          preview.push(`  Description will be updated with proper trademarks`);
        }
      }
    });

    setStatus(preview.length > 0 ? preview.join('\n') : 'All projects already have proper trademarks');
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Trademark Compliance Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This tool updates all project titles and descriptions to include proper trademark symbols 
            as required by GAF® brand guidelines.
          </AlertDescription>
        </Alert>

        <div className="flex gap-4">
          <Button onClick={previewChanges} variant="outline">
            Preview Changes
          </Button>
          <Button onClick={updateAllProjects} className="bg-emerald-600 hover:bg-emerald-700">
            Apply Trademark Updates
          </Button>
        </div>

        {status && (
          <pre className="mt-4 p-4 bg-gray-100 rounded text-sm whitespace-pre-wrap">
            {status}
          </pre>
        )}

        {issues.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Issues Found:</h4>
            <ul className="list-disc list-inside text-sm text-red-600">
              {issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-4">
          <p className="font-semibold mb-1">Trademark Rules Applied:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>GAF Timberline HDZ → GAF Timberline HDZ® Shingles</li>
            <li>GAF ArmorShield II → GAF ArmorShield™ II</li>
            <li>CertainTeed Landmark → CertainTeed Landmark®</li>
            <li>All GAF mentions → GAF®</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}