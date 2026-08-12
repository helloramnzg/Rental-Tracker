export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      billing_cycles: {
        Row: {
          billing_date: string
          created_at: string
          id: string
          month: number
          mother_meter_bill: number
          property_id: string
          status: Database["public"]["Enums"]["billing_cycle_status"]
          year: number
        }
        Insert: {
          billing_date: string
          created_at?: string
          id?: string
          month: number
          mother_meter_bill: number
          property_id: string
          status?: Database["public"]["Enums"]["billing_cycle_status"]
          year: number
        }
        Update: {
          billing_date?: string
          created_at?: string
          id?: string
          month?: number
          mother_meter_bill?: number
          property_id?: string
          status?: Database["public"]["Enums"]["billing_cycle_status"]
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_cycles_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      charges: {
        Row: {
          billing_cycle_id: string
          created_at: string
          electricity: number
          id: string
          other_charges: number
          previous_balance: number
          rent: number
          tenant_id: string
          total_due: number
          water: number
        }
        Insert: {
          billing_cycle_id: string
          created_at?: string
          electricity?: number
          id?: string
          other_charges?: number
          previous_balance?: number
          rent?: number
          tenant_id: string
          total_due?: number
          water?: number
        }
        Update: {
          billing_cycle_id?: string
          created_at?: string
          electricity?: number
          id?: string
          other_charges?: number
          previous_balance?: number
          rent?: number
          tenant_id?: string
          total_due?: number
          water?: number
        }
        Relationships: [
          {
            foreignKeyName: "charges_billing_cycle_id_fkey"
            columns: ["billing_cycle_id"]
            isOneToOne: false
            referencedRelation: "billing_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_soas: {
        Row: {
          billing_cycle_id: string
          emailed_at: string | null
          generated_at: string
          id: string
          pdf_path: string
          tenant_id: string
        }
        Insert: {
          billing_cycle_id: string
          emailed_at?: string | null
          generated_at?: string
          id?: string
          pdf_path: string
          tenant_id: string
        }
        Update: {
          billing_cycle_id?: string
          emailed_at?: string | null
          generated_at?: string
          id?: string
          pdf_path?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_soas_billing_cycle_id_fkey"
            columns: ["billing_cycle_id"]
            isOneToOne: false
            referencedRelation: "billing_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_soas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      meter_readings: {
        Row: {
          billing_cycle_id: string
          created_at: string
          current_reading: number
          id: string
          previous_reading: number
          rate_per_kwh: number
          unit1_electricity: number
          unit2_electricity: number
          usage_kwh: number
        }
        Insert: {
          billing_cycle_id: string
          created_at?: string
          current_reading: number
          id?: string
          previous_reading: number
          rate_per_kwh: number
          unit1_electricity?: number
          unit2_electricity?: number
          usage_kwh?: number
        }
        Update: {
          billing_cycle_id?: string
          created_at?: string
          current_reading?: number
          id?: string
          previous_reading?: number
          rate_per_kwh?: number
          unit1_electricity?: number
          unit2_electricity?: number
          usage_kwh?: number
        }
        Relationships: [
          {
            foreignKeyName: "meter_readings_billing_cycle_id_fkey"
            columns: ["billing_cycle_id"]
            isOneToOne: true
            referencedRelation: "billing_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          billing_cycle_id: string
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          payment_date: string
          reference_number: string | null
          tenant_id: string
        }
        Insert: {
          amount: number
          billing_cycle_id: string
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date?: string
          reference_number?: string | null
          tenant_id: string
        }
        Update: {
          amount?: number
          billing_cycle_id?: string
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date?: string
          reference_number?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_billing_cycle_id_fkey"
            columns: ["billing_cycle_id"]
            isOneToOne: false
            referencedRelation: "billing_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          default_electricity_rate: number
          email_notifications_enabled: boolean
          id: string
          in_app_notifications_enabled: boolean
          property_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_electricity_rate?: number
          email_notifications_enabled?: boolean
          id?: string
          in_app_notifications_enabled?: boolean
          property_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_electricity_rate?: number
          email_notifications_enabled?: boolean
          id?: string
          in_app_notifications_enabled?: boolean
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          active: boolean
          advance_rent: number
          created_at: string
          due_day: number | null
          email: string | null
          end_date: string | null
          full_name: string
          id: string
          mobile: string | null
          monthly_rent: number
          notes: string | null
          security_deposit: number
          start_date: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          advance_rent?: number
          created_at?: string
          due_day?: number | null
          email?: string | null
          end_date?: string | null
          full_name: string
          id?: string
          mobile?: string | null
          monthly_rent?: number
          notes?: string | null
          security_deposit?: number
          start_date: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          advance_rent?: number
          created_at?: string
          due_day?: number | null
          email?: string | null
          end_date?: string | null
          full_name?: string
          id?: string
          mobile?: string | null
          monthly_rent?: number
          notes?: string | null
          security_deposit?: number
          start_date?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          active: boolean
          created_at: string
          electricity_type: Database["public"]["Enums"]["unit_electricity_type"]
          floor: number | null
          id: string
          name: string
          property_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          electricity_type: Database["public"]["Enums"]["unit_electricity_type"]
          floor?: number | null
          id?: string
          name: string
          property_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          electricity_type?: Database["public"]["Enums"]["unit_electricity_type"]
          floor?: number | null
          id?: string
          name?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      billing_cycle_status:
        | "draft"
        | "billing_complete"
        | "soa_generated"
        | "sent"
        | "closed"
      payment_method: "cash" | "gcash" | "bank_transfer"
      unit_electricity_type: "submeter" | "residual"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      billing_cycle_status: [
        "draft",
        "billing_complete",
        "soa_generated",
        "sent",
        "closed",
      ],
      payment_method: ["cash", "gcash", "bank_transfer"],
      unit_electricity_type: ["submeter", "residual"],
    },
  },
} as const

