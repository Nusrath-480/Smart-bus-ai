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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      alternative_recommendations: {
        Row: {
          created_at: string
          id: number
          is_demo: boolean
          original_bus_id: string | null
          reason: string | null
          recommended_bus_id: string
          score: number | null
          stop_id: string | null
          student_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          is_demo?: boolean
          original_bus_id?: string | null
          reason?: string | null
          recommended_bus_id: string
          score?: number | null
          stop_id?: string | null
          student_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          is_demo?: boolean
          original_bus_id?: string | null
          reason?: string | null
          recommended_bus_id?: string
          score?: number | null
          stop_id?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alternative_recommendations_original_bus_id_fkey"
            columns: ["original_bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alternative_recommendations_recommended_bus_id_fkey"
            columns: ["recommended_bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alternative_recommendations_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: false
            referencedRelation: "route_stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alternative_recommendations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: number
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: number
        }
        Relationships: []
      }
      bus_assignments: {
        Row: {
          bus_id: string
          created_at: string
          driver_id: string
          end_date: string | null
          id: string
          is_active: boolean
          route_id: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          bus_id: string
          created_at?: string
          driver_id: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          route_id?: string | null
          start_date?: string
          updated_at?: string
        }
        Update: {
          bus_id?: string
          created_at?: string
          driver_id?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          route_id?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bus_assignments_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bus_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bus_assignments_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      bus_locations: {
        Row: {
          bus_id: string
          heading: number | null
          id: number
          is_demo: boolean
          latitude: number
          longitude: number
          recorded_at: string
          speed_kmh: number | null
          trip_id: string | null
        }
        Insert: {
          bus_id: string
          heading?: number | null
          id?: number
          is_demo?: boolean
          latitude: number
          longitude: number
          recorded_at?: string
          speed_kmh?: number | null
          trip_id?: string | null
        }
        Update: {
          bus_id?: string
          heading?: number | null
          id?: number
          is_demo?: boolean
          latitude?: number
          longitude?: number
          recorded_at?: string
          speed_kmh?: number | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bus_locations_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bus_locations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      buses: {
        Row: {
          bus_number: string
          capacity: number
          created_at: string
          id: string
          is_demo: boolean
          notes: string | null
          registration_number: string | null
          route_id: string | null
          status: Database["public"]["Enums"]["bus_status"]
          updated_at: string
        }
        Insert: {
          bus_number: string
          capacity: number
          created_at?: string
          id?: string
          is_demo?: boolean
          notes?: string | null
          registration_number?: string | null
          route_id?: string | null
          status?: Database["public"]["Enums"]["bus_status"]
          updated_at?: string
        }
        Update: {
          bus_number?: string
          capacity?: number
          created_at?: string
          id?: string
          is_demo?: boolean
          notes?: string | null
          registration_number?: string | null
          route_id?: string | null
          status?: Database["public"]["Enums"]["bus_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buses_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          license_number: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          license_number?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          license_number?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drivers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      eta_predictions: {
        Row: {
          bus_id: string
          confidence: number | null
          created_at: string
          id: number
          is_demo: boolean
          model_version: string | null
          predicted_arrival: string
          stop_id: string
          trip_id: string | null
        }
        Insert: {
          bus_id: string
          confidence?: number | null
          created_at?: string
          id?: number
          is_demo?: boolean
          model_version?: string | null
          predicted_arrival: string
          stop_id: string
          trip_id?: string | null
        }
        Update: {
          bus_id?: string
          confidence?: number | null
          created_at?: string
          id?: number
          is_demo?: boolean
          model_version?: string | null
          predicted_arrival?: string
          stop_id?: string
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eta_predictions_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eta_predictions_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: false
            referencedRelation: "route_stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eta_predictions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          bus_id: string | null
          created_at: string
          description: string | null
          id: string
          latitude: number | null
          longitude: number | null
          reported_by: string
          resolved_at: string | null
          severity: Database["public"]["Enums"]["severity_level"]
          status: Database["public"]["Enums"]["incident_status"]
          trip_id: string | null
          type: Database["public"]["Enums"]["incident_type"]
          updated_at: string
        }
        Insert: {
          bus_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          reported_by: string
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["severity_level"]
          status?: Database["public"]["Enums"]["incident_status"]
          trip_id?: string | null
          type: Database["public"]["Enums"]["incident_type"]
          updated_at?: string
        }
        Update: {
          bus_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          reported_by?: string
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["severity_level"]
          status?: Database["public"]["Enums"]["incident_status"]
          trip_id?: string | null
          type?: Database["public"]["Enums"]["incident_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      occupancy_observations: {
        Row: {
          bus_id: string
          id: number
          is_demo: boolean
          passenger_count: number
          recorded_at: string
          source: string
          stop_id: string | null
          trip_id: string | null
        }
        Insert: {
          bus_id: string
          id?: number
          is_demo?: boolean
          passenger_count: number
          recorded_at?: string
          source?: string
          stop_id?: string | null
          trip_id?: string | null
        }
        Update: {
          bus_id?: string
          id?: number
          is_demo?: boolean
          passenger_count?: number
          recorded_at?: string
          source?: string
          stop_id?: string | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "occupancy_observations_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupancy_observations_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: false
            referencedRelation: "route_stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupancy_observations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      occupancy_predictions: {
        Row: {
          bus_id: string
          confidence: number | null
          created_at: string
          id: number
          is_demo: boolean
          model_version: string | null
          predicted_count: number
          predicted_for: string
          stop_id: string | null
        }
        Insert: {
          bus_id: string
          confidence?: number | null
          created_at?: string
          id?: number
          is_demo?: boolean
          model_version?: string | null
          predicted_count: number
          predicted_for: string
          stop_id?: string | null
        }
        Update: {
          bus_id?: string
          confidence?: number | null
          created_at?: string
          id?: number
          is_demo?: boolean
          model_version?: string | null
          predicted_count?: number
          predicted_for?: string
          stop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "occupancy_predictions_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupancy_predictions_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: false
            referencedRelation: "route_stops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      route_deviation_events: {
        Row: {
          bus_id: string
          detected_at: string
          distance_from_route_m: number | null
          id: number
          is_demo: boolean
          kind: string
          latitude: number | null
          longitude: number | null
          resolved_at: string | null
          trip_id: string | null
        }
        Insert: {
          bus_id: string
          detected_at?: string
          distance_from_route_m?: number | null
          id?: number
          is_demo?: boolean
          kind?: string
          latitude?: number | null
          longitude?: number | null
          resolved_at?: string | null
          trip_id?: string | null
        }
        Update: {
          bus_id?: string
          detected_at?: string
          distance_from_route_m?: number | null
          id?: number
          is_demo?: boolean
          kind?: string
          latitude?: number | null
          longitude?: number | null
          resolved_at?: string | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_deviation_events_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_deviation_events_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      route_stops: {
        Row: {
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          route_id: string
          scheduled_offset_minutes: number | null
          sequence: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          route_id: string
          scheduled_offset_minutes?: number | null
          sequence: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          route_id?: string
          scheduled_offset_minutes?: number | null
          sequence?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          bus_id: string | null
          created_at: string
          days_of_week: number[]
          departure_time: string
          direction: Database["public"]["Enums"]["trip_direction"]
          id: string
          is_active: boolean
          route_id: string
          updated_at: string
        }
        Insert: {
          bus_id?: string | null
          created_at?: string
          days_of_week?: number[]
          departure_time: string
          direction?: Database["public"]["Enums"]["trip_direction"]
          id?: string
          is_active?: boolean
          route_id: string
          updated_at?: string
        }
        Update: {
          bus_id?: string | null
          created_at?: string
          days_of_week?: number[]
          departure_time?: string
          direction?: Database["public"]["Enums"]["trip_direction"]
          id?: string
          is_active?: boolean
          route_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          default_route_id: string | null
          default_stop_id: string | null
          department: string | null
          id: string
          profile_id: string
          roll_number: string | null
          updated_at: string
          year_of_study: number | null
        }
        Insert: {
          created_at?: string
          default_route_id?: string | null
          default_stop_id?: string | null
          department?: string | null
          id?: string
          profile_id: string
          roll_number?: string | null
          updated_at?: string
          year_of_study?: number | null
        }
        Update: {
          created_at?: string
          default_route_id?: string | null
          default_stop_id?: string | null
          department?: string | null
          id?: string
          profile_id?: string
          roll_number?: string | null
          updated_at?: string
          year_of_study?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "students_default_route_id_fkey"
            columns: ["default_route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_default_stop_id_fkey"
            columns: ["default_stop_id"]
            isOneToOne: false
            referencedRelation: "route_stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      trips: {
        Row: {
          bus_id: string
          created_at: string
          direction: Database["public"]["Enums"]["trip_direction"]
          driver_id: string | null
          ended_at: string | null
          id: string
          route_id: string | null
          schedule_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["trip_status"]
          updated_at: string
        }
        Insert: {
          bus_id: string
          created_at?: string
          direction?: Database["public"]["Enums"]["trip_direction"]
          driver_id?: string | null
          ended_at?: string | null
          id?: string
          route_id?: string | null
          schedule_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
        }
        Update: {
          bus_id?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["trip_direction"]
          driver_id?: string | null
          ended_at?: string | null
          id?: string
          route_id?: string | null
          schedule_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_exists: { Args: never; Returns: boolean }
      claim_first_admin: { Args: never; Returns: boolean }
      driver_assigned_to_bus: {
        Args: { _bus_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "driver" | "student"
      bus_status: "active" | "maintenance" | "inactive"
      incident_status: "open" | "acknowledged" | "resolved"
      incident_type: "breakdown" | "emergency" | "accident" | "delay" | "other"
      severity_level: "low" | "medium" | "high" | "critical"
      trip_direction: "to_college" | "from_college"
      trip_status: "scheduled" | "in_progress" | "completed" | "cancelled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "driver", "student"],
      bus_status: ["active", "maintenance", "inactive"],
      incident_status: ["open", "acknowledged", "resolved"],
      incident_type: ["breakdown", "emergency", "accident", "delay", "other"],
      severity_level: ["low", "medium", "high", "critical"],
      trip_direction: ["to_college", "from_college"],
      trip_status: ["scheduled", "in_progress", "completed", "cancelled"],
    },
  },
} as const
