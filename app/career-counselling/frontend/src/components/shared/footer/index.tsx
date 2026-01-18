import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary-blue">AlumNiti</h3>
            <p className="text-gray-300">
              Guiding students towards their perfect career path with expert
              advice and comprehensive resources.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-gray-300 hover:text-primary-blue"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="mailto:aditya.jain.pansari@research.iiit.ac.in"
                  className="text-gray-300 hover:text-primary-blue"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-gray-300 hover:text-primary-blue"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/become-expert"
                  className="text-gray-300 hover:text-primary-blue"
                >
                  Become an Expert
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/blogs"
                  className="text-gray-300 hover:text-primary-blue"
                >
                  Blogs
                </Link>
              </li>
              <li>
                <Link
                  href="/videos"
                  className="text-gray-300 hover:text-primary-blue"
                >
                  Videos
                </Link>
              </li>
              <li>
                <Link
                  href="/experts"
                  className="text-gray-300 hover:text-primary-blue"
                >
                  Find an Expert
                </Link>
                </li>
                <li>
                <Link
                  href="/assessments/riasec"
                  className="text-gray-300 hover:text-primary-blue"
                >
                  RIASEC Assessment
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-300 hover:text-primary-blue"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-300 hover:text-primary-blue"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/cookie"
                  className="text-gray-300 hover:text-primary-blue"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-gray-700" />

        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>© 2025 AlumNiti. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="#" className="hover:text-primary-blue">
              Facebook
            </Link>
            <Link href="#" className="hover:text-primary-blue">
              Twitter
            </Link>
            <Link href="#" className="hover:text-primary-blue">
              LinkedIn
            </Link>
            <Link href="#" className="hover:text-primary-blue">
              Instagram
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
