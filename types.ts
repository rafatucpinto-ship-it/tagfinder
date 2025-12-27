export interface Group {
  id: string;
  name: string;
  description: string;
  type: 'switch' | 'cftv' | 'embarcados';
  createdAt: number;
  createdBy: string;
}

// Interface Base com campos comuns a todos
interface BaseItem {
  id: string;
  locationName: string;
  equipment: string; // Observações
  coordinates?: {
    lat: number;
    lng: number;
  };
  createdAt: number;
  createdBy: string;
  authorEmail?: string;
}

// Item exclusivo para Switch
export interface SwitchItem extends BaseItem {
  type: 'switch';
  switchTag: string;
  switchBrand?: string;
  ip: string;
  panel?: string;
}

// Item exclusivo para CFTV
export interface CftvItem extends BaseItem {
  type: 'cftv';
  cameraTag: string;
  status: 'online' | 'offline';
  connectedSwitch?: string;
  ip: string;
  panel?: string;
}

// Item exclusivo para Embarcados
export interface EmbarcadosItem extends BaseItem {
  type: 'embarcados';
  equipmentTag: string;       // TAG
  model?: string;             // MODELO
  aviActive: boolean;         // AVI ATIVO?
  ipAviLte?: string;          // IP AVI LTE
  ipAviWifi?: string;         // IP AVI WIFI
  ipCisco?: string;           // IP CISCO
  ipSwitchEmb?: string;       // IP SWITCH (Contexto Embarcados)
  gRouter?: string;           // G407 / G610 / Router
  dimTimPle?: string;         // DIM/TIM/PLE
  ipOptalerta?: string;       // IP Optalerta
  ipMems?: string;            // IP MEMS
}

// Union Type - O GroupItem pode ser UM desses três, nunca uma mistura
export type GroupItem = SwitchItem | CftvItem | EmbarcadosItem;

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}