import mongoose, { Schema, Document, Types } from "mongoose";

export interface IExperience {
  companyName: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
}

export interface IEducation {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: number;
}

export interface ILanguage {
  languageName: string;
  level: "basic" | "intermediate" | "advanced" | "native";
}

export interface IPortfolio {
  image: string; // Project image URL (Cloudinary or any CDN)
  projectLink: string; // Link to the project
}

export interface IProfile extends Document {
  userId: Types.ObjectId; // Reference to User model
  firstName: string;
  lastName: string;
  jobTitle: string;
  experience: IExperience[];
  education: IEducation[];
  languages: ILanguage[];
  skills: string[];
  hourlyRate: number;
  profileDescription?: string;
  profileImage?: string; // Profile picture URL
  portfolio: IPortfolio[]; // Array of projects with images and links
  cityName: string;
  address?: string;
  country: string;
  zipcode?: string;
  verification: Types.ObjectId; // Reference to Verification model
  reviews: Types.ObjectId[]; // Reference to Review model
}

const ProfileSchema = new Schema<IProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    jobTitle: { type: String, required: true },
    experience: [
      {
        companyName: { type: String, required: true },
        position: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        description: { type: String },
      },
    ],
    education: [
      {
        institution: { type: String, required: true },
        degree: { type: String, required: true },
        fieldOfStudy: { type: String, required: true },
        graduationYear: { type: Number, required: true },
      },
    ],
    languages: [
      {
        languageName: { type: String, required: true },
        level: {
          type: String,
          enum: ["basic", "intermediate", "advanced", "native"],
          required: true,
        },
      },
    ],
    skills: [{ type: String, required: true }],
    hourlyRate: { type: Number, required: true },
    profileDescription: { type: String },
    profileImage: { type: String }, // Optional Profile Image
    portfolio: [
      {
        image: { type: String, required: true }, // Project image URL
        projectLink: { type: String, required: true }, // Link to the project
      },
    ],
    cityName: { type: String, required: true },
    address: { type: String },
    country: {
      type: String,
      required: true,
      validate: {
        validator: function (value: string) {
          return !["Bangladesh", "Pakistan"].includes(value);
        },
        message: "Country cannot be Bangladesh or Pakistan",
      },
    },
    zipcode: { type: String },
    verification: { type: Schema.Types.ObjectId, ref: "Verification" },
    reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
  },
  { timestamps: true }
);

const Profile =
  mongoose.models.Profile || mongoose.model<IProfile>("Profile", ProfileSchema);
export default Profile;
