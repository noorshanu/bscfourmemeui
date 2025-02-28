// @ts-nocheck 
'use client'
import React, { useState, useEffect, useRef } from 'react'
import { FaPlus, FaEthereum, FaCalendarAlt, FaArrowRight, FaTimes } from 'react-icons/fa'
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { toast } from 'react-hot-toast';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { SigninMessage } from '@/utils/SigninMessage';
import bs58 from 'bs58';
import { getCsrfToken, signIn, signOut, useSession } from "next-auth/react";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { sendTransaction } from 'viem/actions';
import { API_URL } from '@/utils/config';
import FunHero from '@/components/FunHero';
import LogoutButton from '@/components/Logout';
import { BsFillPersonLinesFill } from "react-icons/bs";
import { encodeCreateInstruction } from '@/utils/decode';
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

  // const wallet = useWallet()
  const { connection } = useConnection();


 

  const fetchProjects = async () => {
    try {
      if (!wallet.publicKey) {
        setProjects([]);
        setProjectCount(0);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/project?owner=${wallet.publicKey.toBase58()}`);
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
      if (wallet.publicKey) {
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
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      const recipientPubKey = new PublicKey("FeeDAjMaMzeSy3pqCXMue3hBWhNbivD1JR8ZqtVr3P19");
      // const recipientPubKey = new PublicKey("4DVEu1jXmjdcfZZYRGCHUCySAKh51DLRVKucUp3du2ia");

      const { blockhash } = await connection.getLatestBlockhash();

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: recipientPubKey,
          // lamports: Number(0.01) * LAMPORTS_PER_SOL,
          lamports: Number(1) * LAMPORTS_PER_SOL,

        })
      );

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      const signedTx = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature);


      const response = await fetch(`${API_URL}/api/project/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProject.name,
          description: newProject.description,
          owner: wallet.publicKey?.toBase58()
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

  const wallet = useWallet();
  const walletModal = useWalletModal();

  const handleSignIn = async () => {
    try {
      if (!wallet.connected) {
        walletModal.setVisible(true);
      }

      const csrf = await getCsrfToken();
      if (!wallet.publicKey || !csrf || !wallet.signMessage) return;

      const message = new SigninMessage({
        domain: window.location.host,
        publicKey: wallet.publicKey?.toBase58(),
        statement: `Sign this message to sign in to the app.`,
        nonce: csrf,
      });

      const data = new TextEncoder().encode(message.prepare());
      const signature = await wallet.signMessage(data);
      const serializedSignature = bs58.encode(signature);

      signIn("credentials", {
        message: JSON.stringify(message),
        redirect: false,
        signature: serializedSignature,
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (wallet.connected) {
      handleSignIn();
    }
  }, [wallet.connected]);

  useEffect(() => {
    if (wallet.connected) {
      fetchProjects();
    }
  }, [wallet.connected]);

  if (!wallet.connected) {
    return (
      <DefaultLayout>
        <div className="container mx-auto px-6 min-h-screen ">
           <FunHero/>
          <div className="text-white text-xl text-center font-bold">[ Please connect your wallet first ]</div>

          {/* <div className=' flex justify-center'>
            <LogoutButton/>
          </div> */}
          <div>
            <FunInfo/>
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
      <div className="container mx-auto p-6 min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-lg sm:text-2xl font-semibold mb-4    text-center">My Projects</h1>
          <button 
            className="bg-[#85f0ab] text-black  py-3 px-6 rounded-lg text-sm  hover:bg-[#9e9e9e] transition duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
            onClick={() => setShowCreatePopup(true)}
          >
            <FaPlus />
            Create New Project
          </button>
        </div>

        {/* Create Project Popup */}
        {showCreatePopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-99">
            <div className="bg-[#1b1d23] rounded-lg  border-2 border-black p-6 w-full max-w-md relative">
              <button 
                onClick={() => setShowCreatePopup(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
                disabled={creatingProject}
              >
                <FaTimes />
              </button>
              
              <h2 className="text-2xl font-bold   mb-6">Create New Project</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium  mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                    className="mb-4 w-full rounded-full border bg-[#000] text-white border-gray-300 p-2  focus:border-green-500 focus:outline-none "
                    placeholder="Enter project name"
                    disabled={creatingProject}
                  />
                </div>
                
                <div>
                  <label className="block text-sm  mb-2">
                    Description *
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    className="w-full rounded-lg bg-[#000000] border border-gray-300 py-2 px-3  text-sm focus:outline-none focus:border-[#4CAF50] h-24"
                    placeholder="Enter project description"
                    disabled={creatingProject}
                  />
                </div>

                <button
                  onClick={createProject}
                  disabled={creatingProject}
                  className={`w-full bg-[#85f0ab] text-black  py-3 px-6 border-2 border-black font-semibold rounded-lg hover:bg-[#adadad] transition duration-300 flex items-center justify-center gap-2 ${creatingProject ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {creatingProject ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating....
                    </>
                  ) : (
                    'Create Project Fee (1 SOL)'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="bg-[#1f2937] rounded-lg shadow-[4px_4px_0_0_black] border-2 border-black  p-12 text-center relative z-50">
            <div className="text-gray-400 text-lg mb-6 ">No projects yet.</div>
            <button
              className="bg-[#85f0ab] text-black py-3 px-6 rounded-lg hover:bg-[#b5b5b5] transition duration-300 inline-flex items-center gap-2"
              onClick={() => setShowCreatePopup(true)}
            >
              <FaPlus />
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-40">
            {projects.map((project) => (
              <div
                key={project._id}
                onClick={() => window.location.href = `/pumpfun/${project._id}`}
                className="bg-[#1b1d23] rounded-lg shadow-[4px_4px_0_0_black] border-2 border-black  p-6 cursor-pointer transform hover:scale-[1.02] transition duration-300 hover:shadow-xl "
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold  ">{project.name}</h3>
                  <div className="bg-[#1C1C1C] p-2 rounded-lg">
                    <BsFillPersonLinesFill className="text-[#ffffff]" />
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-400 text-sm">
                   
                    <span className="truncate">{project.description}</span>
                  </div>
                  <div className="flex items-center text-gray-400 text-sm">
                    <FaCalendarAlt className="mr-2" />
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <span className="text-green-500 flex items-center gap-2 text-sm font-medium font-gotham">
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