import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [clickCount, setClickCount] = useState(0);
  
  // Method 1: Only show in development mode
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  // Method 2: Hidden activation - triple click in bottom-right corner
  useEffect(() => {
    const handleSecretActivation = (e: MouseEvent) => {
      // Check if click is in bottom-right corner (100x100px area)
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      if (e.clientX > windowWidth - 100 && e.clientY > windowHeight - 100) {
        setClickCount(prev => prev + 1);
        
        // Reset count after 1 second
        setTimeout(() => setClickCount(0), 1000);
      }
    };
    
    window.addEventListener('click', handleSecretActivation);
    return () => window.removeEventListener('click', handleSecretActivation);
  }, []);
  
  // Show debug button after 3 clicks in corner
  const showDebugButton = clickCount >= 3;
  
  // Method 3: URL parameter activation - add ?debug=true to URL
  const urlParams = new URLSearchParams(window.location.search);
  const debugParam = urlParams.get('debug') === 'true';
  
  // Method 4: Keyboard shortcut - Ctrl+Shift+D
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
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
  
  // Only show button if activated by URL param or secret clicks
  if (!isOpen && !debugParam && !showDebugButton) {
    return null;
  }
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 opacity-50 hover:opacity-100 transition-opacity"
      >
        Debug
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
      <div className="bg-white m-4 p-4 rounded-lg max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Debug Info</h2>
          <button onClick={() => setIsOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          <p>Activation methods:</p>
          <ul className="list-disc ml-5">
            <li>Add ?debug=true to URL</li>
            <li>Triple-click in bottom-right corner</li>
            <li>Press Ctrl+Shift+D</li>
          </ul>
        </div>
        
        <pre className="text-xs overflow-x-auto bg-gray-100 p-4 rounded">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
}