export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string | null
          creditos: number
          creditos_transf: number
          criado_por: number | null
          email: string
          id: number
          ip_address: string | null
          key: string
          last_active: string | null
          nome: string
          pin: string | null
          profile_photo: string | null
          rank: string | null
          session_token: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string | null
          creditos?: number
          creditos_transf?: number
          criado_por?: number | null
          email: string
          id?: number
          ip_address?: string | null
          key: string
          last_active?: string | null
          nome: string
          pin?: string | null
          profile_photo?: string | null
          rank?: string | null
          session_token?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string | null
          creditos?: number
          creditos_transf?: number
          criado_por?: number | null
          email?: string
          id?: number
          ip_address?: string | null
          key?: string
          last_active?: string | null
          nome?: string
          pin?: string | null
          profile_photo?: string | null
          rank?: string | null
          session_token?: string | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admins_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      carteira_estudante: {
        Row: {
          admin_id: number
          cpf: string
          created_at: string
          data_expiracao: string | null
          data_nascimento: string
          faculdade: string
          graduacao: string
          id: number
          nome: string
          perfil_imagem: string | null
          qrcode: string | null
          rg: string
          senha: string
        }
        Insert: {
          admin_id: number
          cpf: string
          created_at?: string
          data_expiracao?: string | null
          data_nascimento: string
          faculdade: string
          graduacao: string
          id?: number
          nome: string
          perfil_imagem?: string | null
          qrcode?: string | null
          rg: string
          senha: string
        }
        Update: {
          admin_id?: number
          cpf?: string
          created_at?: string
          data_expiracao?: string | null
          data_nascimento?: string
          faculdade?: string
          graduacao?: string
          id?: number
          nome?: string
          perfil_imagem?: string | null
          qrcode?: string | null
          rg?: string
          senha?: string
        }
        Relationships: []
      }
      chas: {
        Row: {
          admin_id: number
          categoria: string | null
          cpf: string
          created_at: string | null
          data_nascimento: string | null
          emissao: string | null
          expires_at: string | null
          foto: string | null
          id: number
          limite_navegacao: string | null
          nome: string
          numero_inscricao: string | null
          orgao_emissao: string | null
          qrcode: string | null
          requisitos: string | null
          senha: string | null
          validade: string | null
        }
        Insert: {
          admin_id: number
          categoria?: string | null
          cpf: string
          created_at?: string | null
          data_nascimento?: string | null
          emissao?: string | null
          expires_at?: string | null
          foto?: string | null
          id?: number
          limite_navegacao?: string | null
          nome: string
          numero_inscricao?: string | null
          orgao_emissao?: string | null
          qrcode?: string | null
          requisitos?: string | null
          senha?: string | null
          validade?: string | null
        }
        Update: {
          admin_id?: number
          categoria?: string | null
          cpf?: string
          created_at?: string | null
          data_nascimento?: string | null
          emissao?: string | null
          expires_at?: string | null
          foto?: string | null
          id?: number
          limite_navegacao?: string | null
          nome?: string
          numero_inscricao?: string | null
          orgao_emissao?: string | null
          qrcode?: string | null
          requisitos?: string | null
          senha?: string | null
          validade?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string | null
          from_admin_id: number | null
          id: number
          to_admin_id: number
          total_price: number | null
          transaction_type: string
          unit_price: number | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          from_admin_id?: number | null
          id?: number
          to_admin_id: number
          total_price?: number | null
          transaction_type: string
          unit_price?: number | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          from_admin_id?: number | null
          id?: number
          to_admin_id?: number
          total_price?: number | null
          transaction_type?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_from_admin_id_fkey"
            columns: ["from_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_to_admin_id_fkey"
            columns: ["to_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      downloads: {
        Row: {
          abafe_apk: string | null
          abafe_iphone: string | null
          cnh_apk: string | null
          cnh_iphone: string | null
          govbr_apk: string | null
          govbr_iphone: string | null
          id: number
          updated_at: string
        }
        Insert: {
          abafe_apk?: string | null
          abafe_iphone?: string | null
          cnh_apk?: string | null
          cnh_iphone?: string | null
          govbr_apk?: string | null
          govbr_iphone?: string | null
          id?: number
          updated_at?: string
        }
        Update: {
          abafe_apk?: string | null
          abafe_iphone?: string | null
          cnh_apk?: string | null
          cnh_iphone?: string | null
          govbr_apk?: string | null
          govbr_iphone?: string | null
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      hapvida_atestados: {
        Row: {
          admin_id: number
          cidade_hospital: string | null
          codigo_autenticacao: string | null
          codigo_doenca: string | null
          cpf_paciente: string
          created_at: string | null
          crm: string | null
          data_apartir: string | null
          data_expiracao: string | null
          data_hora: string | null
          descricao_doenca: string | null
          dias_afastamento: number | null
          endereco_hospital: string | null
          horario_atendimento: string | null
          id: number
          ip: string | null
          link_validacao: string | null
          nome_hospital: string | null
          nome_medico: string | null
          nome_paciente: string
          pdf_url: string | null
        }
        Insert: {
          admin_id: number
          cidade_hospital?: string | null
          codigo_autenticacao?: string | null
          codigo_doenca?: string | null
          cpf_paciente: string
          created_at?: string | null
          crm?: string | null
          data_apartir?: string | null
          data_expiracao?: string | null
          data_hora?: string | null
          descricao_doenca?: string | null
          dias_afastamento?: number | null
          endereco_hospital?: string | null
          horario_atendimento?: string | null
          id?: number
          ip?: string | null
          link_validacao?: string | null
          nome_hospital?: string | null
          nome_medico?: string | null
          nome_paciente: string
          pdf_url?: string | null
        }
        Update: {
          admin_id?: number
          cidade_hospital?: string | null
          codigo_autenticacao?: string | null
          codigo_doenca?: string | null
          cpf_paciente?: string
          created_at?: string | null
          crm?: string | null
          data_apartir?: string | null
          data_expiracao?: string | null
          data_hora?: string | null
          descricao_doenca?: string | null
          dias_afastamento?: number | null
          endereco_hospital?: string | null
          horario_atendimento?: string | null
          id?: number
          ip?: string | null
          link_validacao?: string | null
          nome_hospital?: string | null
          nome_medico?: string | null
          nome_paciente?: string
          pdf_url?: string | null
        }
        Relationships: []
      }
      monthly_goals: {
        Row: {
          created_at: string
          id: number
          month: number
          target_revenue: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: number
          month: number
          target_revenue?: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          id?: number
          month?: number
          target_revenue?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      pix_payments: {
        Row: {
          admin_id: number
          admin_name: string
          amount: number
          created_at: string | null
          credits: number
          id: number
          paid_at: string | null
          status: string
          transaction_id: string
        }
        Insert: {
          admin_id: number
          admin_name: string
          amount: number
          created_at?: string | null
          credits: number
          id?: number
          paid_at?: string | null
          status?: string
          transaction_id: string
        }
        Update: {
          admin_id?: number
          admin_name?: string
          amount?: number
          created_at?: string | null
          credits?: number
          id?: number
          paid_at?: string | null
          status?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pix_payments_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          credit_packages: Json
          id: number
          recarga_em_dobro: boolean
          reseller_credits: number
          reseller_price: number
          updated_at: string
        }
        Insert: {
          credit_packages?: Json
          id?: number
          recarga_em_dobro?: boolean
          reseller_credits?: number
          reseller_price?: number
          updated_at?: string
        }
        Update: {
          credit_packages?: Json
          id?: number
          recarga_em_dobro?: boolean
          reseller_credits?: number
          reseller_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      price_tiers: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          max_qty: number | null
          min_qty: number
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean
          max_qty?: number | null
          min_qty: number
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean
          max_qty?: number | null
          min_qty?: number
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      sub_recharge_plans: {
        Row: {
          admin_id: number
          badge: string | null
          badge_color: string | null
          base_credits: number
          bonus: number
          created_at: string
          credits: number
          id: number
          is_active: boolean
          name: string
          pix_copy_paste: string | null
          qr_code_image: string | null
          sort_order: number | null
          total: number
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          admin_id: number
          badge?: string | null
          badge_color?: string | null
          base_credits: number
          bonus?: number
          created_at?: string
          credits: number
          id?: number
          is_active?: boolean
          name: string
          pix_copy_paste?: string | null
          qr_code_image?: string | null
          sort_order?: number | null
          total: number
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          admin_id?: number
          badge?: string | null
          badge_color?: string | null
          base_credits?: number
          bonus?: number
          created_at?: string
          credits?: number
          id?: number
          is_active?: boolean
          name?: string
          pix_copy_paste?: string | null
          qr_code_image?: string | null
          sort_order?: number | null
          total?: number
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          admin_id: number
          categoria: string | null
          cnh_definitiva: string | null
          cnh_frente_url: string | null
          cnh_meio_url: string | null
          cnh_verso_url: string | null
          codigo_seguranca: string | null
          cpf: string
          created_at: string | null
          data_emissao: string | null
          data_expiracao: string | null
          data_nascimento: string | null
          data_validade: string | null
          doc_identidade: string | null
          espelho: string | null
          estado_extenso: string | null
          foto_url: string | null
          hab: string | null
          id: number
          local_emissao: string | null
          local_nascimento: string | null
          mae: string | null
          matriz_final: string | null
          nacionalidade: string | null
          nome: string
          numero_registro: string | null
          obs: string | null
          pai: string | null
          pdf_url: string | null
          qrcode_url: string | null
          renach: string | null
          senha: string | null
          sexo: string | null
          uf: string | null
          updated_at: string | null
        }
        Insert: {
          admin_id: number
          categoria?: string | null
          cnh_definitiva?: string | null
          cnh_frente_url?: string | null
          cnh_meio_url?: string | null
          cnh_verso_url?: string | null
          codigo_seguranca?: string | null
          cpf: string
          created_at?: string | null
          data_emissao?: string | null
          data_expiracao?: string | null
          data_nascimento?: string | null
          data_validade?: string | null
          doc_identidade?: string | null
          espelho?: string | null
          estado_extenso?: string | null
          foto_url?: string | null
          hab?: string | null
          id?: number
          local_emissao?: string | null
          local_nascimento?: string | null
          mae?: string | null
          matriz_final?: string | null
          nacionalidade?: string | null
          nome: string
          numero_registro?: string | null
          obs?: string | null
          pai?: string | null
          pdf_url?: string | null
          qrcode_url?: string | null
          renach?: string | null
          senha?: string | null
          sexo?: string | null
          uf?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_id?: number
          categoria?: string | null
          cnh_definitiva?: string | null
          cnh_frente_url?: string | null
          cnh_meio_url?: string | null
          cnh_verso_url?: string | null
          codigo_seguranca?: string | null
          cpf?: string
          created_at?: string | null
          data_emissao?: string | null
          data_expiracao?: string | null
          data_nascimento?: string | null
          data_validade?: string | null
          doc_identidade?: string | null
          espelho?: string | null
          estado_extenso?: string | null
          foto_url?: string | null
          hab?: string | null
          id?: number
          local_emissao?: string | null
          local_nascimento?: string | null
          mae?: string | null
          matriz_final?: string | null
          nacionalidade?: string | null
          nome?: string
          numero_registro?: string | null
          obs?: string | null
          pai?: string | null
          pdf_url?: string | null
          qrcode_url?: string | null
          renach?: string | null
          senha?: string | null
          sexo?: string | null
          uf?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      usuarios_crlv: {
        Row: {
          admin_id: number
          ano_fab: string | null
          ano_mod: string | null
          capacidade: string | null
          carroceria: string | null
          cat_obs: string | null
          categoria: string | null
          chassi: string | null
          cmt: string | null
          cod_seg_cla: string | null
          combustivel: string | null
          cor: string | null
          cpf_cnpj: string
          created_at: string | null
          data_emissao: string | null
          data_expiracao: string | null
          eixos: string | null
          especie_tipo: string | null
          exercicio: string
          id: number
          local_emissao: string | null
          lotacao: string | null
          marca_modelo: string
          motor: string | null
          nome_proprietario: string
          numero_crv: string | null
          observacoes: string | null
          pdf_url: string | null
          peso_bruto: string | null
          placa: string
          placa_ant: string | null
          potencia_cil: string | null
          qrcode_url: string | null
          renavam: string
          seguranca_crv: string | null
          senha: string | null
        }
        Insert: {
          admin_id: number
          ano_fab?: string | null
          ano_mod?: string | null
          capacidade?: string | null
          carroceria?: string | null
          cat_obs?: string | null
          categoria?: string | null
          chassi?: string | null
          cmt?: string | null
          cod_seg_cla?: string | null
          combustivel?: string | null
          cor?: string | null
          cpf_cnpj: string
          created_at?: string | null
          data_emissao?: string | null
          data_expiracao?: string | null
          eixos?: string | null
          especie_tipo?: string | null
          exercicio: string
          id?: number
          local_emissao?: string | null
          lotacao?: string | null
          marca_modelo: string
          motor?: string | null
          nome_proprietario: string
          numero_crv?: string | null
          observacoes?: string | null
          pdf_url?: string | null
          peso_bruto?: string | null
          placa: string
          placa_ant?: string | null
          potencia_cil?: string | null
          qrcode_url?: string | null
          renavam: string
          seguranca_crv?: string | null
          senha?: string | null
        }
        Update: {
          admin_id?: number
          ano_fab?: string | null
          ano_mod?: string | null
          capacidade?: string | null
          carroceria?: string | null
          cat_obs?: string | null
          categoria?: string | null
          chassi?: string | null
          cmt?: string | null
          cod_seg_cla?: string | null
          combustivel?: string | null
          cor?: string | null
          cpf_cnpj?: string
          created_at?: string | null
          data_emissao?: string | null
          data_expiracao?: string | null
          eixos?: string | null
          especie_tipo?: string | null
          exercicio?: string
          id?: number
          local_emissao?: string | null
          lotacao?: string | null
          marca_modelo?: string
          motor?: string | null
          nome_proprietario?: string
          numero_crv?: string | null
          observacoes?: string | null
          pdf_url?: string | null
          peso_bruto?: string | null
          placa?: string
          placa_ant?: string | null
          potencia_cil?: string | null
          qrcode_url?: string | null
          renavam?: string
          seguranca_crv?: string | null
          senha?: string | null
        }
        Relationships: []
      }
      usuarios_rg: {
        Row: {
          admin_id: number
          assinatura_url: string | null
          cpf: string
          created_at: string | null
          data_emissao: string | null
          data_expiracao: string | null
          data_nascimento: string | null
          foto_url: string | null
          genero: string | null
          id: number
          local_emissao: string | null
          mae: string | null
          nacionalidade: string | null
          naturalidade: string | null
          nome: string
          nome_social: string | null
          orgao_expedidor: string | null
          pai: string | null
          pdf_url: string | null
          qrcode_url: string | null
          rg_frente_url: string | null
          rg_verso_url: string | null
          senha: string | null
          uf: string | null
          updated_at: string | null
          validade: string | null
        }
        Insert: {
          admin_id: number
          assinatura_url?: string | null
          cpf: string
          created_at?: string | null
          data_emissao?: string | null
          data_expiracao?: string | null
          data_nascimento?: string | null
          foto_url?: string | null
          genero?: string | null
          id?: number
          local_emissao?: string | null
          mae?: string | null
          nacionalidade?: string | null
          naturalidade?: string | null
          nome: string
          nome_social?: string | null
          orgao_expedidor?: string | null
          pai?: string | null
          pdf_url?: string | null
          qrcode_url?: string | null
          rg_frente_url?: string | null
          rg_verso_url?: string | null
          senha?: string | null
          uf?: string | null
          updated_at?: string | null
          validade?: string | null
        }
        Update: {
          admin_id?: number
          assinatura_url?: string | null
          cpf?: string
          created_at?: string | null
          data_emissao?: string | null
          data_expiracao?: string | null
          data_nascimento?: string | null
          foto_url?: string | null
          genero?: string | null
          id?: number
          local_emissao?: string | null
          mae?: string | null
          nacionalidade?: string | null
          naturalidade?: string | null
          nome?: string
          nome_social?: string | null
          orgao_expedidor?: string | null
          pai?: string | null
          pdf_url?: string | null
          qrcode_url?: string | null
          rg_frente_url?: string | null
          rg_verso_url?: string | null
          senha?: string | null
          uf?: string | null
          updated_at?: string | null
          validade?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_admin: {
        Args: { target_id: number; viewer_id: number }
        Returns: boolean
      }
      create_master: {
        Args: {
          p_creator_id: number
          p_email: string
          p_key: string
          p_nome: string
          p_session_token: string
        }
        Returns: number
      }
      create_reseller: {
        Args: {
          p_creator_id: number
          p_email: string
          p_key: string
          p_nome: string
          p_session_token: string
        }
        Returns: number
      }
      get_admin_balance: {
        Args: { p_admin_id: number; p_session_token: string }
        Returns: number
      }
      get_admin_by_id: {
        Args: { p_admin_id: number; p_session_token: string }
        Returns: {
          created_at: string
          creditos: number
          email: string
          id: number
          nome: string
          profile_photo: string
          rank: string
        }[]
      }
      get_admin_rank: { Args: { p_admin_id: number }; Returns: string }
      get_all_masters: {
        Args: { p_admin_id: number; p_session_token: string }
        Returns: {
          created_at: string
          creditos: number
          email: string
          id: number
          nome: string
        }[]
      }
      get_creator_name: {
        Args: { p_admin_id: number; p_session_token: string }
        Returns: {
          creator_id: number
          creator_name: string
          creator_telefone: string
        }[]
      }
      get_dashboard_stats: {
        Args: { p_admin_id: number; p_session_token: string }
        Returns: {
          total_credits: number
          total_masters: number
          total_resellers: number
        }[]
      }
      get_price_tiers: {
        Args: { p_admin_id: number; p_session_token: string }
        Returns: {
          id: number
          is_active: boolean
          max_qty: number
          min_qty: number
          price: number
        }[]
      }
      get_resellers_by_master: {
        Args: { p_master_id: number; p_session_token: string }
        Returns: {
          created_at: string
          creditos: number
          email: string
          id: number
          nome: string
        }[]
      }
      hash_password: { Args: { p_password: string }; Returns: string }
      is_valid_admin: {
        Args: { p_admin_id: number; p_session_token: string }
        Returns: boolean
      }
      logout_admin: { Args: { p_admin_id: number }; Returns: boolean }
      recharge_credits: {
        Args: {
          p_admin_id: number
          p_amount: number
          p_total_price: number
          p_unit_price: number
        }
        Returns: boolean
      }
      search_admins: {
        Args: { p_admin_id: number; p_query: string; p_session_token: string }
        Returns: {
          creditos: number
          email: string
          id: number
          nome: string
          rank: string
        }[]
      }
      set_admin_pin: {
        Args: { p_admin_id: number; p_pin: string }
        Returns: boolean
      }
      transfer_credits: {
        Args: {
          p_amount: number
          p_from_admin_id: number
          p_to_admin_id: number
        }
        Returns: boolean
      }
      validate_login: {
        Args: { p_email: string; p_key: string }
        Returns: {
          creditos: number
          email: string
          has_pin: boolean
          id: number
          nome: string
          profile_photo: string
          rank: string
          session_token: string
        }[]
      }
      validate_pin: {
        Args: { p_admin_id: number; p_pin: string }
        Returns: boolean
      }
      verify_password: {
        Args: { p_hash: string; p_password: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
