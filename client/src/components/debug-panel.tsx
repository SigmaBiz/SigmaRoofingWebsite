import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  useEffect(() => {
    const checkAPIs = async () => {
      const info: any = {
        userAgent: navigator.userAgent,
        isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
        origin: window.location.origin,
        pathname: window.location.pathname,
        localStorage: {
          hasImages: false,
          hasProjects: false,
          imageCount: 0,
          projectCount: 0
        },
        api: {
          imagesStatus: 'checking...',
          projectsStatus: 'checking...',
          imagesError: null,
          projectsError: null
        }
      };
      
      // Check localStorage
      const imageKeys = ['heroBackground', 'residentialRoofingImage', 'roofRepairImage'];
      let imageCount = 0;
      imageKeys.forEach(key => {
        if (localStorage.getItem(key)) imageCount++;
      });
      info.localStorage.imageCount = imageCount;
      info.localStorage.hasImages = imageCount > 0;
      
      const projectsData = localStorage.getItem('adminProjects');
      if (projectsData) {
        try {
          const projects = JSON.parse(projectsData);
          info.localStorage.projectCount = projects.length;
          info.localStorage.hasProjects = true;
        } catch (e) {
          info.localStorage.hasProjects = false;
        }
      }
      
      // Test API endpoints
      try {
        const imagesResponse = await fetch(`${window.location.origin}/api/website-images`);
        info.api.imagesStatus = `${imagesResponse.status} ${imagesResponse.statusText}`;
        if (imagesResponse.ok) {
          const data = await imagesResponse.json();
          info.api.imagesData = data;
        }
      } catch (e) {
        info.api.imagesStatus = 'Failed';
        info.api.imagesError = e instanceof Error ? e.message : 'Unknown error';
      }
      
      try {
        const projectsResponse = await fetch(`${window.location.origin}/api/projects`);
        info.api.projectsStatus = `${projectsResponse.status} ${projectsResponse.statusText}`;
        if (projectsResponse.ok) {
          const data = await projectsResponse.json();
          info.api.projectsData = data;
        }
      } catch (e) {
        info.api.projectsStatus = 'Failed';
        info.api.projectsError = e instanceof Error ? e.message : 'Unknown error';
      }
      
      setDebugInfo(info);
    };
    
    checkAPIs();
  }, []);
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50"
      >
        Debug
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
      <div className="bg-white m-4 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Debug Info</h2>
          <button onClick={() => setIsOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <pre className="text-xs overflow-x-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
}