"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, Edit2, Save, User as UserIcon, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

const categories = [
  "Open",
  "EWS",
  "OBC-NCL",
  "SC",
  "ST",
  "Open-PwD",
  "EWS-PwD",
  "OBC-NCL-PwD",
  "SC-PwD",
  "ST-PwD",
];

const states = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [gender, setGender] = useState("");
  const [category, setCategory] = useState("");
  const [homeState, setHomeState] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authUser) {
      setProfile({
        id: authUser._id || "",
        email: authUser.email || "",
        firstName: authUser.firstName || "",
        lastName: authUser.lastName || "",
        type: authUser.type || "regular",
        gender: typeof authUser.gender === "string" ? authUser.gender : "",
        category:
          typeof authUser.category === "string" ? authUser.category : "",
        mobileNo:
          typeof authUser.mobileNo === "string" ? authUser.mobileNo : "",
        password:
          typeof authUser.password === "string" ? authUser.password : "",
        isAdmin: Boolean(authUser.isAdmin),
        isExpert: Boolean(authUser.isExpert),
        wallet: Number(authUser.wallet || 0),
        middleName: authUser.middleName,
      });
      setRole(authUser.isAdmin ? "Admin" : authUser.isExpert ? "Expert" : "");
      setGender(typeof authUser.gender === "string" ? authUser.gender : "");
      setCategory(
        typeof authUser.category === "string" ? authUser.category : ""
      );
      setHomeState(
        typeof authUser.home_state === "string" ? authUser.home_state : ""
      );
      setMobileNo(
        typeof authUser.mobileNo === "string" ? authUser.mobileNo : ""
      );
      setFirstName(
        typeof authUser.firstName === "string" ? authUser.firstName : ""
      );
      setMiddleName(
        typeof authUser.middleName === "string" ? authUser.middleName : ""
      );
      setLastName(
        typeof authUser.lastName === "string" ? authUser.lastName : ""
      );
      setLoading(false);
    } else {
      // Fallback to fetching if not available in context
      fetchProfile();
    }
  }, [authUser]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProfile(response.data);
      setRole(
        response.data.isAdmin ? "Admin" : response.data.isExpert ? "Expert" : ""
      );
      setGender(response.data.gender || "");
      setCategory(response.data.category || "");
      setHomeState(response.data.home_state || "");
      setMobileNo(response.data.mobileNo || "");
      setFirstName(response.data.firstName || "");
      setMiddleName(response.data.middleName || "");
      setLastName(response.data.lastName || "");
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      await axios.put(
        "/api/profile",
        {
          firstName,
          middleName,
          lastName,
          gender: gender === "unspecified" ? "" : gender,
          category: category === "unspecified" ? "" : category,
          home_state: homeState === "unspecified" ? "" : homeState,
          mobileNo,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProfile({
        ...profile!,
        firstName,
        middleName,
        lastName,
        gender,
        category,
        home_state: homeState,
        mobileNo,
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // If loading, show a loading indicator
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If no profile, show an error message
  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-red-600">
          Profile information could not be loaded. Please try again later.
        </h1>
      </div>
    );
  }

  // The actual profile content
  const profileContent = (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Profile Hero */}
      <div
        className={`${
          profile.type === "paid"
            ? "bg-gradient-to-r from-amber-600 to-yellow-700"
            : "bg-gradient-to-r from-primary to-primary/80"
        } rounded-lg shadow-lg mb-8 p-8 text-white`}
      >
        <div className="flex items-center space-x-4">
          <div className="bg-white p-3 rounded-full">
            <UserIcon className="h-12 w-12 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {profile.firstName} {profile.middleName} {profile.lastName}
            </h1>
            <p className="text-sm mt-1 opacity-80">{profile.email}</p>
            <div className="flex items-center space-x-3 mt-2">
              <Badge variant="secondary" className="text-xs">
                {profile.type.charAt(0).toUpperCase() + profile.type.slice(1)}
              </Badge>
              {role && (
                <Badge variant="secondary" className="text-xs">
                  {role}
                </Badge>
              )}
              <Link href="/wallet">
                <Badge
                  variant="secondary"
                  className="text-xs flex items-center cursor-pointer"
                >
                  <Wallet className="h-3 w-3 mr-1" />
                  {profile.wallet || 0} coins
                </Badge>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl text-primary">
              Profile Information
            </CardTitle>
            <Button
              onClick={() =>
                isEditing ? handleUpdateProfile() : setIsEditing(true)
              }
              className={`${
                isEditing
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-primary hover:bg-primary/90"
              }`}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : isEditing ? (
                <Save className="h-4 w-4 mr-2" />
              ) : (
                <Edit2 className="h-4 w-4 mr-2" />
              )}
              {isEditing ? "Save Changes" : "Edit Profile"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-primary">
                Personal Information
              </h3>
              <Separator />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input value={profile.email} disabled className="bg-gray-50" />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Middle Name
                </label>
                <Input
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-primary">
                Additional Information
              </h3>
              <Separator />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <Select
                  value={gender || "unspecified"}
                  onValueChange={setGender}
                  disabled={!isEditing}
                >
                  <SelectTrigger className={!isEditing ? "bg-gray-50" : ""}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unspecified">Not Specified</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <Select
                  value={category || "unspecified"}
                  onValueChange={setCategory}
                  disabled={!isEditing}
                >
                  <SelectTrigger className={!isEditing ? "bg-gray-50" : ""}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unspecified">Not Specified</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat.toLowerCase()}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Home State
                </label>
                <Select
                  value={homeState || "unspecified"}
                  onValueChange={setHomeState}
                  disabled={!isEditing}
                >
                  <SelectTrigger className={!isEditing ? "bg-gray-50" : ""}>
                    <SelectValue placeholder="Select home state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unspecified">Not Specified</SelectItem>
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Mobile Number
                </label>
                <Input
                  type="tel"
                  value={mobileNo}
                  onChange={(e) => setMobileNo(e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                  placeholder="Enter mobile number"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Wrap the content with ProtectedRoute
  return <ProtectedRoute>{profileContent}</ProtectedRoute>;
}
