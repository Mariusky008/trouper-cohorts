export type OpportunityType = 
  | 'clients' 
  | 'live' 
  | 'intro' 
  | 'network' 
  | 'recommendation' 
  | 'service' 
  | 'synergy' 
  | 'social'
  | 'feedback'
  | 'custom';

export type OpportunityStatus = 'pending' | 'validated' | 'rejected' | 'available' | 'sold' | 'disputed';
export type OpportunityVisibility = 'private' | 'public';

export interface NetworkOpportunity {
  id: string;
  created_at: string;
  giver_id: string;
  receiver_id?: string;
  type: OpportunityType;
  points: number;
  details?: string;
  status: OpportunityStatus;
  validated_at?: string;
  
  // Public Market Fields
  visibility: OpportunityVisibility;
  price?: number;
  public_title?: string;
  private_details?: string;
  buyer_id?: string;
  
  // Relations (often joined)
  giver?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    trade?: string;
  };
  receiver?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    trade?: string;
  };
  buyer?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    trade?: string;
  };
}

export interface NetworkMatch {
  id: string;
  date: string;
  user1_id: string;
  user2_id: string;
  status: 'pending' | 'met' | 'missed';
  
  // Partner info (computed based on current user)
  partner?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    trade?: string;
    city?: string;
    trust_score?: number;
  };
}

export interface TrustScore {
  user_id: string;
  score: number;
  opportunities_given: number;
  opportunities_received: number;
  debt_level: number;
  last_updated: string;
}

export interface NetworkAvailability {
  id: string;
  user_id: string;
  date: string;
  slots: string[];
}
