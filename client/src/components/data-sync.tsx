import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload } from 'lucide-react';

export default function DataSync() {
  const [status, setStatus] = useState('');

  const exportData = () => {
    try {
      // Collect all data from localStorage
      const data: any = {
        exportDate: new Date().toISOString(),
        images: {},
        projects: []
      };

      // Export image URLs
      const imageKeys = [
        'heroBackground', 'heroFeatureImage', 'residentialRoofingImage', 'roofRepairImage',
        'roofInspectionImage', 'gutterServiceImage', 'stormDamageImage',
        'paintingServiceImage', 'teamPhoto', 'visionImage', 'companyLogo',
        'processStep1Image', 'processStep2Image', 'processStep3Image',
        'processStep4Image', 'testimonialBackground', 'stormReportBackground'
      ];

      imageKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          data.images[key] = value;
        }
      });

      // Export projects
      const projectsData = localStorage.getItem('adminProjects');
      if (projectsData) {
        data.projects = JSON.parse(projectsData);
      }

      // Create downloadable file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sigma-roofing-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setStatus('Data exported successfully!');
    } catch (error) {
      setStatus('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Import images
        if (data.images) {
          Object.entries(data.images).forEach(([key, value]) => {
            localStorage.setItem(key, value as string);
          });
        }

        // Import projects
        if (data.projects) {
          localStorage.setItem('adminProjects', JSON.stringify(data.projects));
        }

        setStatus(`Data imported successfully! ${Object.keys(data.images || {}).length} images and ${data.projects?.length || 0} projects.`);
        
        // Reload page to apply changes
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        setStatus('Import failed: ' + (error instanceof Error ? error.message : 'Invalid file'));
      }
    };

    input.click();
  };

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Data Sync Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button onClick={exportData} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Data
          </Button>
          <Button onClick={importData} variant="outline" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import Data
          </Button>
        </div>
        {status && (
          <p className="text-sm text-gray-600">{status}</p>
        )}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Export saves all images and projects from this device</p>
          <p>• Import loads data from another device</p>
          <p>• Use this to sync data between desktop and mobile</p>
        </div>
      </CardContent>
    </Card>
  );
}