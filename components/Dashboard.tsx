import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { Button } from './Button';
import { Group, UserProfile } from '../types';
import { GroupDetails } from './GroupDetails';
import { LogOut, Router, Video, Cpu, Activity, LayoutGrid, ChevronRight, Server } from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
}

// DEFINIÇÃO DOS GRUPOS FIXOS (COLEÇÕES RAIZ NO FIRESTORE)
const FIXED_GROUPS: Group[] = [
  {
    id: 'telecom', // Coleção: /telecom
    name: 'Telecomunicações',
    description: 'Switches, Roteadores, Patch Panels e infraestrutura de rede.',
    type: 'switch', // Usa o formulário de Switch
    createdAt: Date.now(),
    createdBy: 'system'
  },
  {
    id: 'cftv', // Coleção: /cftv
    name: 'CFTV & Segurança',
    description: 'Câmeras IP/Analógicas, DVRs e dispositivos de segurança.',
    type: 'cftv', // Usa o formulário de CFTV
    createdAt: Date.now(),
    createdBy: 'system'
  },
  {
    id: 'embarcados', // Coleção: /embarcados
    name: 'Sistemas Embarcados',
    description: 'IoT, Sensores, Gateways, Computadores de Bordo e Telemetria.',
    type: 'embarcados', // Usa o formulário de Embarcados
    createdAt: Date.now(),
    createdBy: 'system'
  }
];

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const handleLogout = () => signOut(auth);

  const getGroupStyles = (type: string) => {
    switch (type) {
      case 'cftv':
        return { 
          accent: 'indigo', 
          bg: 'bg-indigo-600',
          gradient: 'from-indigo-600 to-blue-700',
          lightBg: 'bg-indigo-50',
          icon: <Video className="w-8 h-8 text-white" />
        };
      case 'embarcados':
        return { 
          accent: 'amber', 
          bg: 'bg-amber-500',
          gradient: 'from-amber-500 to-orange-600',
          lightBg: 'bg-amber-50',
          icon: <Cpu className="w-8 h-8 text-white" />
        };
      default:
        return { 
          accent: 'blue', 
          bg: 'bg-blue-600',
          gradient: 'from-blue-600 to-cyan-600',
          lightBg: 'bg-blue-50',
          icon: <Router className="w-8 h-8 text-white" />
        };
    }
  };

  if (selectedGroup) {
    return <GroupDetails group={selectedGroup} onBack={() => setSelectedGroup(null)} />;
  }

  return (
    <div className="min-h-screen pb-20">
      <nav className="glass sticky top-0 z-30 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Activity className="text-white w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-slate-900 block leading-none">LocalFinder</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Infra Manager</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Operador</span>
              <span className="text-sm font-semibold text-slate-700">{user.email}</span>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-slate-500">
              <LogOut className="w-5 h-5 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 animate-slide-up">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">Departamentos</h1>
          <p className="text-slate-500 text-lg font-medium max-w-2xl">
            Selecione uma área abaixo para acessar o banco de dados de equipamentos.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FIXED_GROUPS.map((group) => {
            const styles = getGroupStyles(group.type);
            return (
              <div 
                key={group.id} 
                onClick={() => setSelectedGroup(group)}
                className="group relative bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-blue-100 hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col h-full"
              >
                <div className={`h-24 w-full bg-gradient-to-br ${styles.gradient} relative overflow-hidden`}>
                   <div className="absolute -right-4 -bottom-4 opacity-20 transform rotate-12">
                     {React.cloneElement(styles.icon as React.ReactElement, { className: 'w-32 h-32 text-white' })}
                   </div>
                   <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <Server className="w-3 h-3" /> /{group.id}
                      </span>
                   </div>
                </div>

                <div className="p-8 flex flex-col flex-1 relative">
                  <div className={`w-16 h-16 rounded-2xl ${styles.bg} shadow-lg flex items-center justify-center -mt-16 mb-6 border-4 border-white transition-transform duration-500 group-hover:scale-110`}>
                    {styles.icon}
                  </div>
                  
                  <h3 className="text-2xl font-extrabold text-slate-900 mb-3 break-words">
                    {group.name}
                  </h3>
                  
                  <p className="text-slate-500 text-sm leading-relaxed font-medium mb-8">
                    {group.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-6">
                    <span className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                      Acessar Dados
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className={`${styles.lightBg} px-3 py-1 rounded-lg`}>
                       <LayoutGrid className={`w-4 h-4 text-${styles.accent}-600`} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};