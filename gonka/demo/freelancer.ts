export const demoFreelancer = {
  user: {
    id: "demo-freelancer-001",
    wallet_address:
      "0x8a7f3c2d91b4e6f0123456789abcdef1234567890abcdef1234567890abcd",
    role: "freelancer",
  },

  profile: {
    display_name: "Alex Tan",

    bio:
      "Full-stack developer with experience building web applications, REST APIs, and database-driven systems.",

    skills: [
      "PHP",
      "JavaScript",
      "React",
      "TypeScript",
      "MySQL",
    ],

    portfolio_links: [
      "https://github.com/demo-alex-tan",
      "https://alex-tan.dev",
    ],
  },

  verification: {
    github: {
      ownership_verified: true,
      account_age_years: 3,
      public_repositories: 8,
      relevant_repositories: 5,
    },

    skills: [
      {
        skill: "PHP",
        claimed_tier: "Expert",
        verification_score: 78,
        verdict: "SUPPORTED",
        confidence: "HIGH",
      },
      {
        skill: "JavaScript",
        claimed_tier: "Advanced",
        verification_score: 84,
        verdict: "SUPPORTED",
        confidence: "HIGH",
      },
      {
        skill: "React",
        claimed_tier: "Advanced",
        verification_score: 81,
        verdict: "SUPPORTED",
        confidence: "HIGH",
      },
    ],
  },

  work_history: {
    completed_projects: 12,
    completed_milestones: 31,
    on_time_completion_rate: 0.94,
    average_client_rating: 4.7,
    total_client_reviews: 10,
    cancelled_projects: 1,
    disputed_projects: 0,
  },
};