import React, { useState, useEffect } from 'react';
import { db, auth } from '../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Group, GroupItem, EmbarcadosItem, SwitchItem, CftvItem } from '../types';
import { Button } from './Button';
import { Input } from './Input';
import { ArrowLeft, Plus, Search, MapPin, Router, LayoutGrid, Video, Cpu, Filter, Trash2, ExternalLink, Calendar, Globe, Server, Upload, FileSpreadsheet, AlertCircle, ArrowRight, Wifi } from 'lucide-react';
import * as XLSX from 'xlsx';

interface GroupDetailsProps {
  group: Group;
  onBack: () => void;
}

interface ImportField {
  key: string;
  label: string;
  required: boolean;
}

export const GroupDetails: React.FC<GroupDetailsProps> = ({ group, onBack }) => {
  const [items, setItems] = useState<GroupItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Map, 3: Processing
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importLog, setImportLog] = useState<string[]>([]);

  // Estado para controlar a visualização de detalhes
  const [selectedItem, setSelectedItem] = useState<GroupItem | null>(null);
  
  const isCftv = group.type === 'cftv';
  const isEmbarcados = group.type === 'embarcados';
  const isSwitch = group.type === 'switch';

  // Form States (Single Create)
  const [locationName, setLocationName] = useState('');
  const [equipment, setEquipment] = useState('');
  const [useLocation, setUseLocation] = useState(false);
  
  // States comuns/switch/cftv
  const [ip, setIp] = useState('');
  const [panel, setPanel] = useState('');
  const [switchTag, setSwitchTag] = useState('');
  const [switchBrand, setSwitchBrand] = useState('');
  const [cameraTag, setCameraTag] = useState('');
  const [cameraStatus, setCameraStatus] = useState<'online' | 'offline'>('online');
  const [connectedSwitch, setConnectedSwitch] = useState('');

  // States Embarcados (Novos)
  const [equipmentTag, setEquipmentTag] = useState('');
  const [model, setModel] = useState('');
  const [aviActive, setAviActive] = useState('nao'); 
  const [ipAviLte, setIpAviLte] = useState('');
  const [ipAviWifi, setIpAviWifi] = useState('');
  const [ipCisco, setIpCisco] = useState('');
  const [ipSwitchEmb, setIpSwitchEmb] = useState('');
  const [gRouter, setGRouter] = useState('');
  const [dimTimPle, setDimTimPle] = useState('');
  const [ipOptalerta, setIpOptalerta] = useState('');
  const [ipMems, setIpMems] = useState('');

  // --- REALTIME DATA FETCHING ---
  useEffect(() => {
    setLoading(true);
    const itemsRef = collection(db, group.id);
    const q = query(itemsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroupItem));
      setItems(itemsData);
      setLoading(false);
    }, (error) => {
        console.error("Erro ao buscar itens:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [group.id]);

  // --- FORM RESET ---
  const resetForm = () => {
    setLocationName('');
    setEquipment('');
    setUseLocation(false);
    setIp('');
    setPanel('');
    setSwitchTag('');
    setSwitchBrand('');
    setCameraTag('');
    setCameraStatus('online');
    setConnectedSwitch('');
    
    // Reset Embarcados
    setEquipmentTag('');
    setModel('');
    setAviActive('nao');
    setIpAviLte('');
    setIpAviWifi('');
    setIpCisco('');
    setIpSwitchEmb('');
    setGRouter('');
    setDimTimPle('');
    setIpOptalerta('');
    setIpMems('');
  };

  const getTheme = () => {
    if (isCftv) return { accent: 'indigo', icon: <Video className="w-5 h-5" />, label: 'CFTV', createLabel: 'Nova Câmera' };
    if (isEmbarcados) return { accent: 'amber', icon: <Cpu className="w-5 h-5" />, label: 'IoT', createLabel: 'Novo Embarcado' };
    return { accent: 'blue', icon: <Router className="w-5 h-5" />, label: 'Telecom', createLabel: 'Novo Switch' };
  };

  const theme = getTheme();

  // --- IMPORT LOGIC START ---

  const getImportFields = (): ImportField[] => {
    const common = [
      { key: 'equipment', label: 'Observações', required: false },
    ];
    
    if (!isEmbarcados) {
      common.unshift({ key: 'locationName', label: 'Localização (Setor/Sala)', required: true });
    }

    if (isSwitch) {
      return [
        { key: 'switchTag', label: 'TAG do Switch', required: true },
        { key: 'ip', label: 'Endereço IP', required: true },
        { key: 'switchBrand', label: 'Marca/Modelo', required: false },
        { key: 'panel', label: 'Painel', required: false },
        ...common
      ];
    }
    if (isCftv) {
      return [
        { key: 'cameraTag', label: 'TAG da Câmera', required: true },
        { key: 'ip', label: 'Endereço IP', required: true },
        { key: 'status', label: 'Status (Online/Offline)', required: false },
        { key: 'connectedSwitch', label: 'Switch Conectado', required: false },
        { key: 'panel', label: 'Painel', required: false },
        ...common
      ];
    }
    if (isEmbarcados) {
      return [
        { key: 'equipmentTag', label: 'TAG', required: true },
        { key: 'model', label: 'MODELO', required: false },
        { key: 'aviActive', label: 'AVI ATIVO?', required: false },
        { key: 'ipAviLte', label: 'IP AVI LTE', required: false },
        { key: 'ipAviWifi', label: 'IP AVI WIFI', required: false },
        { key: 'ipCisco', label: 'IP CISCO', required: false },
        { key: 'ipSwitchEmb', label: 'IP SWITCH', required: false },
        { key: 'gRouter', label: 'G407 / G610 / Router', required: false },
        { key: 'dimTimPle', label: 'DIM/TIM/PLE', required: false },
        { key: 'ipOptalerta', label: 'IP Optalerta', required: false },
        { key: 'ipMems', label: 'IP MEMS', required: false },
        ...common
      ];
    }
    return [];
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      if (data.length > 0) {
        const headers = data[0] as string[];
        const rows = data.slice(1);
        setExcelHeaders(headers);
        setExcelData(rows);
        setImportStep(2); 
        
        const autoMap: Record<string, string> = {};
        const fields = getImportFields();
        fields.forEach(field => {
          const match = headers.find(h => 
            h.toString().trim().toLowerCase().includes(field.label.toLowerCase()) || 
            h.toString().trim().toLowerCase() === field.key.toLowerCase()
          );
          if (match) autoMap[field.key] = match;
        });
        setColumnMapping(autoMap);
      }
    };
    reader.readAsBinaryString(file);
  };

  const executeImport = async () => {
    setImportStep(3);
    const total = excelData.length;
    let current = 0;
    const currentUser = auth.currentUser;
    const errors: string[] = [];

    setImportProgress({ current: 0, total });

    for (const row of excelData) {
      try {
        const rowData: any = {};
        
        const getValue = (key: string) => {
          const header = columnMapping[key];
          if (!header) return null;
          const index = excelHeaders.indexOf(header);
          if (index === -1) return null;
          const val = row[index];
          return (val !== undefined && val !== null) ? String(val).trim() : ''; 
        };

        rowData.equipment = getValue('equipment');
        rowData.locationName = isEmbarcados ? 'N/A' : (getValue('locationName') || 'Não identificado');
        rowData.createdAt = Date.now();
        rowData.createdBy = currentUser?.uid;
        rowData.authorEmail = currentUser?.email;
        rowData.coordinates = null; 

        if (isSwitch) {
          rowData.type = 'switch';
          rowData.switchTag = getValue('switchTag') || 'S/N';
          rowData.ip = getValue('ip');
          rowData.switchBrand = getValue('switchBrand');
          rowData.panel = getValue('panel');
        } else if (isCftv) {
          rowData.type = 'cftv';
          rowData.cameraTag = getValue('cameraTag') || 'S/N';
          rowData.ip = getValue('ip');
          rowData.status = String(getValue('status')).toLowerCase().includes('off') ? 'offline' : 'online';
          rowData.connectedSwitch = getValue('connectedSwitch');
          rowData.panel = getValue('panel');
        } else if (isEmbarcados) {
          rowData.type = 'embarcados';
          rowData.equipmentTag = getValue('equipmentTag') || 'S/N';
          rowData.model = getValue('model');
          const aviVal = getValue('aviActive');
          rowData.aviActive = typeof aviVal === 'string' && (aviVal.toLowerCase().includes('sim') || aviVal.toLowerCase() === 'true');
          rowData.ipAviLte = getValue('ipAviLte');
          rowData.ipAviWifi = getValue('ipAviWifi');
          rowData.ipCisco = getValue('ipCisco');
          rowData.ipSwitchEmb = getValue('ipSwitchEmb');
          rowData.gRouter = getValue('gRouter');
          rowData.dimTimPle = getValue('dimTimPle');
          rowData.ipOptalerta = getValue('ipOptalerta');
          rowData.ipMems = getValue('ipMems');
        }

        await new Promise(r => setTimeout(r, 10)); 
        await addDoc(collection(db, group.id), rowData);
      } catch (err) {
        console.error(err);
        errors.push(`Erro na linha ${current + 2}`);
      }
      current++;
      setImportProgress({ current, total });
    }

    if (errors.length > 0) {
      setImportLog(errors);
    } else {
      setTimeout(() => {
        setShowImportModal(false);
        setImportStep(1);
        setColumnMapping({});
        alert("Importação concluída com sucesso!");
      }, 500);
    }
  };

  // --- IMPORT LOGIC END ---

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      let coords = null;

      if (useLocation && !isEmbarcados) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
          });
          coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        } catch (err) {
          console.warn("Falha no GPS", err);
        }
      }

      const finalLocationName = isEmbarcados ? 'N/A' : locationName;

      const baseData = {
        locationName: finalLocationName,
        equipment,
        coordinates: coords,
        createdAt: Date.now(),
        createdBy: currentUser?.uid,
        authorEmail: currentUser?.email
      };

      let finalPayload: any;
      if (isEmbarcados) {
        finalPayload = { 
          ...baseData, 
          type: 'embarcados', 
          equipmentTag, 
          model,
          aviActive: aviActive === 'sim', 
          ipAviLte, 
          ipAviWifi, 
          ipCisco, 
          ipSwitchEmb,
          gRouter,
          dimTimPle,
          ipOptalerta, 
          ipMems 
        };
      } else if (isCftv) {
        finalPayload = { ...baseData, type: 'cftv', cameraTag, status: cameraStatus, ip, connectedSwitch, panel };
      } else {
        finalPayload = { ...baseData, type: 'switch', switchTag, switchBrand, ip, panel };
      }

      await addDoc(collection(db, group.id), finalPayload);
      
      setShowModal(false);
      resetForm();
    } catch (error) {
      alert("Erro ao salvar dados: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    if (confirm('Tem certeza que deseja excluir este item permanentemente?')) {
        try {
            await deleteDoc(doc(db, group.id, selectedItem.id));
            setSelectedItem(null); 
        } catch (e) {
            console.error(e);
            alert('Erro ao excluir item.');
        }
    }
  };

  const filteredItems = items.filter(item => {
    const term = searchQuery.toLowerCase();
    const matchesCommon = item.locationName.toLowerCase().includes(term);
    if (isEmbarcados) return matchesCommon || (item as EmbarcadosItem).equipmentTag.toLowerCase().includes(term);
    if (isCftv) return matchesCommon || (item as CftvItem).cameraTag.toLowerCase().includes(term) || (item as CftvItem).ip.includes(term);
    return matchesCommon || (item as SwitchItem).switchTag.toLowerCase().includes(term) || (item as SwitchItem).ip.includes(term);
  });

  // --- RENDERIZAÇÃO DA PÁGINA DE DETALHES (View Item) ---
  if (selectedItem) {
    const isEmbItem = selectedItem.type === 'embarcados';
    const isCftvItem = selectedItem.type === 'cftv';
    const isSwItem = selectedItem.type === 'switch';
    
    // Casting de variáveis para evitar repetição
    const embItem = selectedItem as EmbarcadosItem;
    const cftvItem = selectedItem as CftvItem;
    const swItem = selectedItem as SwitchItem;
    
    const tag = isEmbItem 
        ? (embItem.equipmentTag || 'Sem ID')
        : (isCftvItem 
            ? cftvItem.cameraTag 
            : swItem.switchTag);

    const mainIp = isEmbItem
        ? embItem.ipAviLte
        : (isCftvItem ? cftvItem.ip : swItem.ip);

    return (
      <div className="animate-slide-up min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
            <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-900">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                           {tag}
                           {isCftvItem && (
                               <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full border ${cftvItem.status === 'online' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                   {cftvItem.status}
                               </span>
                           )}
                           {isEmbItem && embItem.aviActive && (
                               <span className="text-[10px] uppercase px-2 py-0.5 rounded-full border bg-green-100 text-green-700 border-green-200">
                                   AVI Ativo
                               </span>
                           )}
                        </h1>
                        <span className="text-xs font-bold text-slate-400">ID: {selectedItem.id}</span>
                    </div>
                </div>
                <Button variant="danger" onClick={handleDeleteItem} className="text-sm px-4 py-2">
                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                </Button>
            </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Cartão Principal */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                        <div className="flex items-start gap-4 mb-6">
                             <div className={`p-3 rounded-2xl bg-${theme.accent}-100 text-${theme.accent}-600`}>
                                 {React.cloneElement(theme.icon as React.ReactElement, { className: 'w-8 h-8' })}
                             </div>
                             <div>
                                 <h2 className="text-lg font-bold text-slate-900">Detalhes do Ativo</h2>
                                 <p className="text-slate-500 text-sm">Informações principais do equipamento.</p>
                             </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                             {!isEmbItem && (
                               <div>
                                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Localização</span>
                                   <div className="flex items-center gap-2 font-semibold text-slate-800">
                                       <MapPin className="w-4 h-4 text-slate-400" />
                                       {selectedItem.locationName}
                                   </div>
                               </div>
                             )}

                             {isEmbItem && (
                                <>
                                  <div>
                                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Modelo</span>
                                      <div className="font-semibold text-slate-800">{embItem.model || '-'}</div>
                                  </div>
                                  <div>
                                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">G407 / Router</span>
                                      <div className="font-semibold text-slate-800">{embItem.gRouter || '-'}</div>
                                  </div>
                                </>
                             )}

                             <div>
                                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                                    {isEmbItem ? 'IP AVI LTE (Principal)' : 'Endereço IP'}
                                 </span>
                                 <div className="flex items-center gap-2 font-mono font-medium text-slate-700 bg-slate-50 w-fit px-2 py-1 rounded-lg border border-slate-100">
                                     <Globe className="w-3 h-3 text-slate-400" />
                                     {mainIp || 'Não definido'}
                                 </div>
                             </div>

                             {isCftvItem && (
                                 <>
                                     <div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Painel / Rack</span>
                                        <div className="font-semibold text-slate-800">{cftvItem.panel || '-'}</div>
                                     </div>
                                     <div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Switch Conectado</span>
                                        <div className="font-semibold text-slate-800">{cftvItem.connectedSwitch || '-'}</div>
                                     </div>
                                 </>
                             )}

                             {isSwItem && (
                                 <>
                                     <div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Marca / Modelo</span>
                                        <div className="font-semibold text-slate-800">{swItem.switchBrand || '-'}</div>
                                     </div>
                                     <div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Painel</span>
                                        <div className="font-semibold text-slate-800">{swItem.panel || '-'}</div>
                                     </div>
                                 </>
                             )}
                        </div>
                    </div>

                    {isEmbItem && (
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                            <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Server className="w-5 h-5 text-amber-500" />
                                Tabela de IPs e Dispositivos
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Wifi className="w-3 h-3"/> IP AVI WIFI</span>
                                    <div className="font-mono text-sm text-slate-700">{embItem.ipAviWifi || '-'}</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Globe className="w-3 h-3"/> IP CISCO</span>
                                    <div className="font-mono text-sm text-slate-700">{embItem.ipCisco || '-'}</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Router className="w-3 h-3"/> IP SWITCH</span>
                                    <div className="font-mono text-sm text-slate-700">{embItem.ipSwitchEmb || '-'}</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">DIM / TIM / PLE</span>
                                    <div className="font-mono text-sm text-slate-700">{embItem.dimTimPle || '-'}</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">IP Optalerta</span>
                                    <div className="font-mono text-sm text-slate-700">{embItem.ipOptalerta || '-'}</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">IP MEMS</span>
                                    <div className="font-mono text-sm text-slate-700">{embItem.ipMems || '-'}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                        <h3 className="text-md font-bold text-slate-900 mb-4">Observações Técnicas</h3>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {selectedItem.equipment || "Nenhuma observação registrada."}
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {!isEmbItem && (
                      selectedItem.coordinates ? (
                          <div className="bg-white rounded-3xl p-1 border border-slate-200 shadow-sm overflow-hidden">
                              <div className="bg-slate-100 h-32 flex items-center justify-center relative">
                                  <MapPin className="w-8 h-8 text-slate-400 absolute" />
                                  <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=0,0&zoom=1&size=400x400')] opacity-10"></div>
                              </div>
                              <div className="p-4">
                                  <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${selectedItem.coordinates.lat},${selectedItem.coordinates.lng}`}
                                    target="_blank"
                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
                                  >
                                    Abrir no Maps <ExternalLink className="w-4 h-4" />
                                  </a>
                              </div>
                          </div>
                      ) : (
                          <div className="bg-slate-50 rounded-3xl p-6 border border-dashed border-slate-300 text-center">
                              <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                              <p className="text-sm text-slate-500 font-medium">Sem localização GPS</p>
                          </div>
                      )
                    )}

                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                        <div>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Registrado por</span>
                             <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                 <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                     {selectedItem.authorEmail?.[0].toUpperCase()}
                                 </div>
                                 {selectedItem.authorEmail}
                             </div>
                        </div>
                        <div>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Data de Criação</span>
                             <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                 <Calendar className="w-4 h-4 text-slate-400" />
                                 {new Date(selectedItem.createdAt).toLocaleDateString()} às {new Date(selectedItem.createdAt).toLocaleTimeString()}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
      </div>
    );
  }

  // --- RENDERIZAÇÃO DA LISTA ---
  return (
    <div className="animate-slide-up">
      <header className="glass sticky top-0 z-20 border-b border-slate-200/60 h-20">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 leading-none">{group.name}</h1>
              <span className={`text-[10px] font-bold uppercase tracking-widest text-${theme.accent}-600`}>Coleção: /{group.id}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setShowImportModal(true)} className="flex">
                <Upload className="w-4 h-4 mr-2" /> Importar
            </Button>
            <Button onClick={() => setShowModal(true)} className={`bg-${theme.accent === 'blue' ? 'blue' : (theme.accent === 'amber' ? 'amber' : 'indigo')}-600`}>
                <Plus className="w-5 h-5 mr-2" />
                {theme.createLabel}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="relative flex-1">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
             <input 
               type="text"
               placeholder="Pesquisar por TAG, IP ou Localização..."
               className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 glass shadow-sm transition-all outline-none text-slate-700 font-medium"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
            <Filter className="w-4 h-4" />
            {filteredItems.length} Itens
          </div>
        </div>

        {/* GRID ATUALIZADO PARA CARDS MENORES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.length === 0 && !loading ? (
            <div className="col-span-full py-20 text-center bg-white/40 rounded-[32px] border border-dashed border-slate-300">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LayoutGrid className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Nenhum registro</h3>
              <p className="text-slate-500 mb-6">Adicione manualmente ou importe uma planilha.</p>
              <Button variant="secondary" onClick={() => setShowImportModal(true)}>
                  <Upload className="w-4 h-4 mr-2" /> Importar Dados
              </Button>
            </div>
          ) : (
            <>
              {filteredItems.map((item) => {
                const embItem = item as EmbarcadosItem;
                const cftvItem = item as CftvItem;
                const switchItem = item as SwitchItem;

                return (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedItem(item)}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden cursor-pointer group"
                  >
                    <div className={`px-4 py-3 flex items-center justify-between border-b border-slate-50 bg-slate-50/50 group-hover:bg-slate-100/50 transition-colors`}>
                      <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg bg-white shadow-sm text-${theme.accent}-600`}>
                            {React.cloneElement(theme.icon as React.ReactElement, { className: 'w-4 h-4' })}
                          </div>
                          <span className="font-bold text-slate-800 tracking-tight text-sm">
                            {isEmbarcados ? (embItem.equipmentTag || 'Sem ID') : (isCftv ? cftvItem.cameraTag : switchItem.switchTag)}
                          </span>
                      </div>
                      { (isSwitch || isCftv) && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-white rounded-md border border-slate-200 text-slate-500 shadow-sm">
                          {(item as any).ip}
                        </span>
                      )}
                      { isEmbarcados && embItem.aviActive && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 rounded-md border border-green-200 shadow-sm whitespace-nowrap">
                          AVI ON
                        </span>
                      )}
                    </div>
                    
                    <div className="p-4">
                      {isEmbarcados ? (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Modelo</span>
                                <span className="text-[10px] font-semibold text-slate-700 truncate block">{embItem.model || '-'}</span>
                            </div>
                            <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">DIM/TIM/PLE</span>
                                <span className="text-[10px] font-semibold text-slate-700 truncate block">{embItem.dimTimPle || '-'}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">IP AVI LTE</span>
                                <span className="text-[10px] font-mono font-medium text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 block w-fit">
                                    {embItem.ipAviLte || '-'}
                                </span>
                            </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                           <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Local</span>
                              <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 truncate">
                                <MapPin className="w-3 h-3 text-slate-400" /> {item.locationName}
                              </div>
                            </div>
                            
                           {isCftv && (
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Status</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${cftvItem.status === 'online' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                {cftvItem.status.toUpperCase()}
                              </span>
                            </div>
                           )}
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-2 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-bold text-blue-700">
                          {item.authorEmail?.[0].toUpperCase()}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 truncate max-w-[100px]">{item.authorEmail}</span>
                      </div>
                      <span className="text-blue-600 text-[10px] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </main>

      {/* Modal de Importação Excel */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowImportModal(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <FileSpreadsheet className="w-6 h-6 text-green-600" /> Importar Excel
                  </h2>
                  <p className="text-sm text-slate-500">Adicione múltiplos registros de uma vez.</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <Trash2 className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-8">
              {/* Etapa 1: Upload */}
              {importStep === 1 && (
                <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 hover:bg-slate-100 transition-colors relative cursor-pointer group">
                  <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                     <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-600" />
                  </div>
                  <p className="text-slate-900 font-bold text-lg">Clique para selecionar o arquivo</p>
                  <p className="text-slate-500 text-sm">Suporta formatos .xlsx e .xls</p>
                </div>
              )}

              {/* Etapa 2: Mapeamento */}
              {importStep === 2 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-blue-900 text-sm">Relacione as Colunas</h4>
                      <p className="text-blue-700 text-xs">Selecione qual coluna do seu Excel corresponde a cada campo do sistema.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                    {getImportFields().map((field) => (
                      <div key={field.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                         <div className="flex-1">
                           <span className="text-sm font-bold text-slate-700 block">{field.label}</span>
                           {field.required && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 rounded uppercase">Obrigatório</span>}
                         </div>
                         <ArrowRight className="w-4 h-4 text-slate-300 mx-4" />
                         <div className="flex-1">
                           <select 
                             className="w-full p-2 rounded-lg border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                             value={columnMapping[field.key] || ''}
                             onChange={(e) => setColumnMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                           >
                             <option value="">-- Selecione a Coluna --</option>
                             {excelHeaders.map(h => (
                               <option key={h} value={h}>{h}</option>
                             ))}
                           </select>
                         </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-slate-100">
                    <Button variant="secondary" className="flex-1" onClick={() => setImportStep(1)}>Voltar</Button>
                    <Button className="flex-1" onClick={executeImport} disabled={getImportFields().filter(f => f.required).some(f => !columnMapping[f.key])}>
                       Confirmar e Importar
                    </Button>
                  </div>
                </div>
              )}

              {/* Etapa 3: Processando */}
              {importStep === 3 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Importando Dados...</h3>
                  <p className="text-slate-500 mb-6">Processando linha {importProgress.current} de {importProgress.total}</p>
                  
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden max-w-sm">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    />
                  </div>

                  {importLog.length > 0 && (
                     <div className="mt-8 w-full bg-red-50 border border-red-100 rounded-2xl p-4 text-left max-h-32 overflow-y-auto">
                        <h4 className="text-xs font-bold text-red-700 uppercase mb-2">Erros Encontrados</h4>
                        <ul className="text-xs text-red-600 list-disc pl-4 space-y-1">
                          {importLog.map((log, idx) => <li key={idx}>{log}</li>)}
                        </ul>
                     </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação Manual (Mantido) */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{theme.createLabel}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <Trash2 className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleAddItem} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
               
               {/* FORMULARIO ESPECIFICO PARA CADA TIPO */}
               
               {/* ----- EMBARCADOS ----- */}
               {isEmbarcados && (
                  <div className="space-y-4">
                      <div className="grid grid-cols-12 gap-4">
                          <div className="col-span-5">
                             <Input label="TAG" value={equipmentTag} onChange={(e) => setEquipmentTag(e.target.value)} required />
                          </div>
                          <div className="col-span-4">
                             <Input label="Modelo" value={model} onChange={(e) => setModel(e.target.value)} />
                          </div>
                          <div className="col-span-3 flex flex-col gap-1">
                             <label className="text-sm font-medium text-slate-700">AVI Ativo?</label>
                             <select 
                                className="px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={aviActive}
                                onChange={(e) => setAviActive(e.target.value)}
                             >
                                <option value="nao">Não</option>
                                <option value="sim">Sim</option>
                             </select>
                          </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
                          <Input label="IP AVI LTE" value={ipAviLte} onChange={(e) => setIpAviLte(e.target.value)} className="bg-white" />
                          <Input label="IP AVI WIFI" value={ipAviWifi} onChange={(e) => setIpAviWifi(e.target.value)} className="bg-white" />
                          <Input label="IP CISCO" value={ipCisco} onChange={(e) => setIpCisco(e.target.value)} className="bg-white" />
                          <Input label="IP SWITCH" value={ipSwitchEmb} onChange={(e) => setIpSwitchEmb(e.target.value)} className="bg-white" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <Input label="G407 / G610 / Router" value={gRouter} onChange={(e) => setGRouter(e.target.value)} />
                          <Input label="DIM / TIM / PLE" value={dimTimPle} onChange={(e) => setDimTimPle(e.target.value)} />
                      </div>

                       <div className="grid grid-cols-2 gap-4">
                          <Input label="IP Optalerta" value={ipOptalerta} onChange={(e) => setIpOptalerta(e.target.value)} />
                          <Input label="IP MEMS" value={ipMems} onChange={(e) => setIpMems(e.target.value)} />
                      </div>
                  </div>
               )}


               {/* ----- CFTV ----- */}
               {isCftv && (
                 <>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="TAG da Câmera" value={cameraTag} onChange={(e) => setCameraTag(e.target.value)} required />
                      <div className="flex flex-col gap-1 w-full">
                        <label className="text-sm font-medium text-slate-700">Status</label>
                        <select className="px-3 py-2 rounded-lg border border-slate-300 bg-white" value={cameraStatus} onChange={(e:any) => setCameraStatus(e.target.value)}>
                            <option value="online">Online</option>
                            <option value="offline">Offline</option>
                        </select>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Endereço IP" value={ip} onChange={(e) => setIp(e.target.value)} required />
                      <Input label="Switch Conectado" value={connectedSwitch} onChange={(e) => setConnectedSwitch(e.target.value)} />
                   </div>
                   <Input label="Painel / Patch Panel" value={panel} onChange={(e) => setPanel(e.target.value)} />
                 </>
               )}

               {/* ----- SWITCH ----- */}
               {isSwitch && (
                 <>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="TAG do Switch" value={switchTag} onChange={(e) => setSwitchTag(e.target.value)} required />
                      <Input label="Marca/Modelo" value={switchBrand} onChange={(e) => setSwitchBrand(e.target.value)} />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Endereço IP" value={ip} onChange={(e) => setIp(e.target.value)} required />
                      <Input label="Painel / Patch Panel" value={panel} onChange={(e) => setPanel(e.target.value)} />
                   </div>
                 </>
               )}
               
               {/* CAMPOS COMUNS (Localização e Obs) - Exceto Local para Embarcados pois não foi pedido na imagem */}
               {!isEmbarcados && (
                   <Input label="Local Exato (Setor/Sala)" value={locationName} onChange={(e) => setLocationName(e.target.value)} required />
               )}
               
               <div className="flex flex-col gap-2">
                 <label className="text-sm font-bold text-slate-700">Observações Técnicas</label>
                 <textarea className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none h-24 text-sm" value={equipment} onChange={(e) => setEquipment(e.target.value)} />
               </div>

               {!isEmbarcados && (
                 <div className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${useLocation ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`} onClick={() => setUseLocation(!useLocation)}>
                    <div className="flex items-center gap-3">
                      <MapPin className={`w-5 h-5 ${useLocation ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className={`text-sm font-bold ${useLocation ? 'text-blue-700' : 'text-slate-500'}`}>Capturar Coordenadas GPS</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${useLocation ? 'bg-blue-600' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${useLocation ? 'left-6' : 'left-1'}`} />
                    </div>
                 </div>
               )}

               <div className="flex gap-4 pt-4">
                  <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)} type="button">Cancelar</Button>
                  <Button type="submit" className="flex-1" isLoading={loading}>Finalizar Cadastro</Button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};