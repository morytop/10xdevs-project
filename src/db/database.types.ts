export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      analytics_events: {
        Row: {
          action_type: Database["public"]["Enums"]["action_type_enum"];
          created_at: string | null;
          id: string;
          metadata: Json | null;
          timestamp: string;
          user_id: string | null;
        };
        Insert: {
          action_type: Database["public"]["Enums"]["action_type_enum"];
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          timestamp: string;
          user_id?: string | null;
        };
        Update: {
          action_type?: Database["public"]["Enums"]["action_type_enum"];
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          timestamp?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      feedback: {
        Row: {
          comment: string | null;
          created_at: string | null;
          id: string;
          meal_plan_id: string | null;
          rating: Database["public"]["Enums"]["rating_enum"];
        };
        Insert: {
          comment?: string | null;
          created_at?: string | null;
          id?: string;
          meal_plan_id?: string | null;
          rating: Database["public"]["Enums"]["rating_enum"];
        };
        Update: {
          comment?: string | null;
          created_at?: string | null;
          id?: string;
          meal_plan_id?: string | null;
          rating?: Database["public"]["Enums"]["rating_enum"];
        };
        Relationships: [
          {
            foreignKeyName: "feedback_meal_plan_id_fkey";
            columns: ["meal_plan_id"];
            isOneToOne: false;
            referencedRelation: "meal_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      meal_plans: {
        Row: {
          created_at: string | null;
          generated_at: string | null;
          id: string;
          meals: Json;
          status: Database["public"]["Enums"]["status_enum"] | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          generated_at?: string | null;
          id?: string;
          meals: Json;
          status?: Database["public"]["Enums"]["status_enum"] | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          generated_at?: string | null;
          id?: string;
          meals?: Json;
          status?: Database["public"]["Enums"]["status_enum"] | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          activity_level: number;
          allergies: string[] | null;
          diet_type: Database["public"]["Enums"]["diet_type_enum"];
          disliked_products: string[] | null;
          health_goal: Database["public"]["Enums"]["health_goal_enum"];
          user_id: string;
        };
        Insert: {
          activity_level: number;
          allergies?: string[] | null;
          diet_type: Database["public"]["Enums"]["diet_type_enum"];
          disliked_products?: string[] | null;
          health_goal: Database["public"]["Enums"]["health_goal_enum"];
          user_id: string;
        };
        Update: {
          activity_level?: number;
          allergies?: string[] | null;
          diet_type?: Database["public"]["Enums"]["diet_type_enum"];
          disliked_products?: string[] | null;
          health_goal?: Database["public"]["Enums"]["health_goal_enum"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      validate_meal_plan_structure: {
        Args: { meals_data: Json };
        Returns: boolean;
      };
    };
    Enums: {
      action_type_enum:
        | "user_registered"
        | "profile_created"
        | "profile_updated"
        | "plan_generated"
        | "plan_regenerated"
        | "plan_accepted"
        | "feedback_given"
        | "api_error";
      diet_type_enum: "STANDARD" | "VEGETARIAN" | "VEGAN" | "GLUTEN_FREE";
      health_goal_enum: "LOSE_WEIGHT" | "GAIN_WEIGHT" | "MAINTAIN_WEIGHT" | "HEALTHY_EATING" | "BOOST_ENERGY";
      rating_enum: "THUMBS_UP" | "THUMBS_DOWN";
      status_enum: "pending" | "generated" | "error";
    };
    CompositeTypes: Record<never, never>;
  };
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      action_type_enum: [
        "user_registered",
        "profile_created",
        "profile_updated",
        "plan_generated",
        "plan_regenerated",
        "plan_accepted",
        "feedback_given",
        "api_error",
      ],
      diet_type_enum: ["STANDARD", "VEGETARIAN", "VEGAN", "GLUTEN_FREE"],
      health_goal_enum: ["LOSE_WEIGHT", "GAIN_WEIGHT", "MAINTAIN_WEIGHT", "HEALTHY_EATING", "BOOST_ENERGY"],
      rating_enum: ["THUMBS_UP", "THUMBS_DOWN"],
      status_enum: ["pending", "generated", "error"],
    },
  },
} as const;
