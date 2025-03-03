// @ts-nocheck 
'use client'
import React, { useState, useEffect } from 'react'
import { FaPlus, FaEthereum, FaCalendarAlt, FaArrowRight, FaTimes } from 'react-icons/fa'
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { toast } from 'react-hot-toast';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { getCsrfToken, signIn, signOut, useSession } from "next-auth/react";
import { API_URL } from '@/utils/config';
import FunHero from '@/components/FunHero';
import LogoutButton from '@/components/Logout';
import { BsFillPersonLinesFill } from "react-icons/bs";
import FunInfo from '@/components/FunInfo';

interface Project {
  _id: string;
  name: string;
  description: string;
  owner: string;
  createdAt: string;
}

const Page = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: ''
  });
  const [projectCount, setProjectCount] = useState(0);

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const fetchProjects = async () => {
    try {
      if (!address) {
        setProjects([]);
        setProjectCount(0);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/project?owner=${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      const sortedProjects = data.sort((a: Project, b: Project) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setProjects(sortedProjects);
      setProjectCount(data.length);
    } catch (error) {
      console.error('Error fetching projects:', error);
      if (address) {
        toast.error('Failed to load projects');
      }
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProject.name || !newProject.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreatingProject(true);
    const loadingToast = toast.loading('Creating project...');

    try {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      const response = await fetch(`${API_URL}/api/project/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProject.name,
          description: newProject.description,
          owner: address
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      toast.dismiss(loadingToast);
      toast.success('Project created successfully!', {
        duration: 5000,
        icon: '🎉'
      });
      
      setShowCreatePopup(false);
      setNewProject({ name: '', description: '' });
      fetchProjects(); // Refresh the projects list
    } catch (error) {
      console.error('Error creating project:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to create project');
    } finally {
      setCreatingProject(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchProjects();
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <DefaultLayout>
        <div className="container mx-auto px-6 pb-12 pt-22 min-h-screen "> 
           <FunHero/>
          <div className="text-white text-xl text-center font-bold">[ Please connect your wallet first ]</div>

          {/* <div className=' flex justify-center'>
            <LogoutButton/>
          </div> */}
          <div>
            {/* <FunInfo/> */}
          </div>
        </div>
      </DefaultLayout>
    );
  }

  if (loading) {
    return (
      <DefaultLayout>
        <div className="container mx-auto p-6 min-h-screen">
          <div className="text-white  font-bold ">Loading projects...</div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="container mx-auto px-8 pb-12 pt-22 min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            My Projects
          </h1>
          <button 
            className="mt-4 sm:mt-0 bg-gradient-to-r from-[#85f0ab] to-[#6bd088] text-black py-3 px-6 rounded-xl text-sm font-medium hover:opacity-90 transition-all duration-300 flex items-center gap-2 shadow-lg"
            onClick={() => setShowCreatePopup(true)}
          >
            <FaPlus className="text-xs" />
            Create New Project
          </button>
        </div>

        {/* Create Project Popup */}
        {showCreatePopup && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#1b1d23] rounded-2xl border border-white/10 p-8 w-full max-w-md relative">
              <button 
                onClick={() => setShowCreatePopup(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                disabled={creatingProject}
              >
                <FaTimes />
              </button>
              
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-8">
                Create New Project
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                    className="w-full rounded-xl border border-white/10 bg-black/50 text-white p-3 focus:border-[#85f0ab] focus:outline-none transition-colors"
                    placeholder="Enter project name"
                    disabled={creatingProject}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    className="w-full rounded-xl border border-white/10 bg-black/50 text-white p-3 focus:border-[#85f0ab] focus:outline-none transition-colors h-24 resize-none"
                    placeholder="Enter project description"
                    disabled={creatingProject}
                  />
                </div>

                <button
                  onClick={createProject}
                  disabled={creatingProject}
                  className={`w-full bg-gradient-to-r from-[#85f0ab] to-[#6bd088] text-black py-3 px-6 rounded-xl font-medium hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-2 ${creatingProject ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {creatingProject ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Project '
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="bg-[#1b1d23] rounded-2xl border border-white/10 p-12 text-center">
            <div className="text-gray-400 text-lg mb-6">No projects yet</div>
            <button
              className="bg-gradient-to-r from-[#85f0ab] to-[#6bd088] text-black py-3 px-6 rounded-xl font-medium hover:opacity-90 transition-all duration-300 inline-flex items-center gap-2"
              onClick={() => setShowCreatePopup(true)}
            >
              <FaPlus className="text-xs" />
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div
                key={project._id}
                onClick={() => window.location.href = `/four-meme/${project._id}`}
                className="group bg-[#1b1d23] rounded-2xl border border-white/10 p-6 cursor-pointer hover:border-[#85f0ab]/50 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-white">{project.name}</h3>
                  <div className="bg-black/30 p-2 rounded-xl">
                    <img src="/bsc.png" alt="" className='w-6 h-6' />
                  </div>
                </div>
                
                <div className="space-y-4 mb-6">
                  <p className="text-gray-400 text-sm line-clamp-2">
                    {project.description}
                  </p>
                  <div className="flex items-center text-gray-400 text-sm">
                    <FaCalendarAlt className="mr-2 text-[#85f0ab]" />
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <span className="text-[#85f0ab] flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    View Details
                    <FaArrowRight />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DefaultLayout>
  )
}

export default Page