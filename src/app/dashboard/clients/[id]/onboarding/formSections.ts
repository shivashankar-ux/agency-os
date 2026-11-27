// Field structure mirrors The Story Builder's Gym Client Onboarding Form, 1:1.

export type FieldType = "text" | "textarea" | "checkbox" | "radio";

export interface FormField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
}

export interface FormSection {
  title: string;
  fields: FormField[];
}

export const FORM_SECTIONS: FormSection[] = [
  {
    title: "1. Basic Details",
    fields: [
      { key: "branch_location", label: "Branch / location(s)", type: "text" },
      { key: "owner_phone", label: "Owner phone / WhatsApp", type: "text" },
      { key: "content_approver", label: "Person who approves content (name, phone)", type: "text" },
      { key: "backup_approver", label: "Backup approver (name, phone)", type: "text" },
      { key: "instagram_handle", label: "Instagram handle", type: "text" },
      { key: "facebook_maps_link", label: "Facebook page / Google Maps link", type: "text" },
      { key: "opening_hours", label: "Opening hours", type: "text" },
      { key: "year_started_members", label: "Year started / approx. members", type: "text" },
    ],
  },
  {
    title: "2. Brand and Look",
    fields: [
      { key: "brand_colours", label: "Brand colours (hex codes if known)", type: "text" },
      { key: "fonts", label: "Fonts used on banners or posters", type: "text" },
      { key: "logo_delivery", label: "Logo file will be sent via (WhatsApp / email / Drive)", type: "text" },
      { key: "three_words", label: "Three words that describe your gym", type: "text" },
      { key: "tone_of_voice", label: "Tone of voice", type: "checkbox", options: ["Motivational", "Fun", "Professional", "Premium", "Family-friendly"] },
      { key: "caption_language", label: "Language for captions and voiceover", type: "checkbox", options: ["English", "Hindi", "Telugu", "Hinglish", "Mix"] },
    ],
  },
  {
    title: "3. What You Sell",
    fields: [
      { key: "membership_plans", label: "Membership plans and prices (monthly, quarterly, yearly)", type: "textarea" },
      { key: "offers_discounts", label: "Offers or discounts running right now", type: "textarea" },
      { key: "other_services", label: "Other services", type: "checkbox", options: ["Personal training", "Group classes", "Zumba", "Yoga", "CrossFit", "Nutrition", "Steam / Sauna", "Other"] },
      { key: "top_selling_points", label: "Your top 3 selling points (why members choose you over nearby gyms)", type: "textarea" },
      { key: "plan_to_sell_more", label: "Which plan or service do you most want to sell more of?", type: "text" },
    ],
  },
  {
    title: "4. Your Audience",
    fields: [
      { key: "ideal_member", label: "Your ideal member", type: "checkbox", options: ["Beginners", "Working professionals", "Students", "Women", "Couples / families", "Seniors", "Athletes"] },
      { key: "member_source", label: "Where do most members come from?", type: "text" },
      { key: "why_join", label: "Why members usually join", type: "checkbox", options: ["Weight loss", "Muscle gain", "General fitness", "Stress relief", "Sports training"] },
      { key: "common_questions", label: "Questions or doubts new visitors often ask you", type: "textarea" },
    ],
  },
  {
    title: "5. Trainers and People on Camera",
    fields: [
      { key: "featured_trainers", label: "Trainers we can feature (names and speciality)", type: "textarea" },
      { key: "camera_comfortable_trainers", label: "Trainers who are comfortable speaking on camera", type: "text" },
      { key: "willing_members", label: "Members willing to share their story (we take written consent)", type: "textarea" },
      { key: "no_camera_people", label: "People who must NOT appear on camera", type: "textarea" },
    ],
  },
  {
    title: "6. Content Preferences",
    fields: [
      { key: "reel_styles", label: "Reel styles you like", type: "checkbox", options: ["Transformations", "Trainer tips", "Gym tour", "Workout of the day", "Member stories", "Myth busting", "Behind the scenes", "Offers and events"] },
      { key: "liked_accounts", label: "Three Instagram accounts or reels you like (links or handles)", type: "textarea" },
      { key: "competitor_gyms", label: "Competitor gyms near you (Instagram handles)", type: "text" },
      { key: "topics_to_avoid", label: "Topics or claims we must avoid", type: "textarea" },
      { key: "music_pref", label: "Music", type: "checkbox", options: ["Popular", "Motivational", "Instrumental", "No preference"] },
    ],
  },
  {
    title: "7. Goals",
    fields: [
      { key: "content_goals", label: "What would you like your content to help with? (tick up to two)", type: "checkbox", options: ["More walk-ins", "More trial sign-ups", "More PT clients", "Stronger brand presence", "Fill off-peak slots"] },
      { key: "three_month_target", label: "Your target for the next 3 months", type: "text" },
      { key: "discovery_channel", label: "How do new members find you today?", type: "text" },
      { key: "runs_paid_ads", label: "Do you run paid ads right now?", type: "radio", options: ["Yes", "No"] },
      { key: "ads_manager", label: "If yes, who manages them?", type: "text" },
    ],
  },
  {
    title: "8. Shoot Logistics",
    fields: [
      { key: "best_shoot_days", label: "Best days for a shoot", type: "text" },
      { key: "best_time_slots", label: "Best time slots (quietest hours)", type: "text" },
      { key: "filmable_areas", label: "Areas of the gym we can film", type: "text" },
      { key: "no_film_areas", label: "Areas we must not film", type: "text" },
      { key: "entry_instructions", label: "Entry / parking instructions", type: "text" },
      { key: "shoot_day_contact", label: "Contact person on shoot day (name, phone)", type: "text" },
    ],
  },
  {
    title: "9. Accounts and Access",
    fields: [
      { key: "posting_responsibility", label: "How should posting work?", type: "radio", options: ["We post on your behalf", "Gym posts itself"] },
      { key: "instagram_access", label: "Instagram access", type: "radio", options: ["Collaborator invite", "Shared login", "Not needed"] },
      { key: "dm_responder", label: "Who replies to DMs and comments?", type: "text" },
      { key: "enquiry_whatsapp", label: "WhatsApp number for enquiries (added to captions)", type: "text" },
    ],
  },
  {
    title: "10. Approvals and Permissions",
    fields: [
      { key: "approval_confirmations", label: "Please confirm", type: "checkbox", options: ["Script approval within 48 hours", "Edit approval within 48 hours", "Up to 2 revision rounds per reel", "Members and trainers on camera have given permission"] },
      { key: "portfolio_permission", label: "The Story Builder may show finished reels in its portfolio", type: "radio", options: ["Yes", "No"] },
    ],
  },
];
