export type Database = {
  public: {
    Tables: {
      perfis: {
        Row: {
          id: string;
          nome: string | null;
          email: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          nome?: string | null;
          email?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          nome?: string | null;
          email?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      registros_sono: {
        Row: {
          id: string;
          user_id: string;
          hora_deitar: string;
          hora_acordar: string;
          duracao_total: number;
          pontos: number;
          data_registro: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          hora_deitar: string;
          hora_acordar: string;
          duracao_total: number;
          pontos?: number;
          data_registro?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          hora_deitar?: string;
          hora_acordar?: string;
          duracao_total?: number;
          pontos?: number;
          data_registro?: string;
        };
        Relationships: [
          {
            foreignKeyName: "registros_sono_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      ranking_oficial: {
        Row: {
          user_id: string | null;
          nome: string | null;
          email: string | null;
          avatar_url: string | null;
          total_pontos: number;
          total_minutos: number;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
