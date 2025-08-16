import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BookOpen, Search, Menu, LogOut, User } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    logout();
  };

  const navLinks = [
    { href: "/", label: "Home", show: true },
    { href: "/my-books", label: "My Books", show: isAuthenticated },
    { href: "/browse", label: "Browse", show: true },
  ];

  const NavLinks = ({ mobile = false }) => (
    <div className={mobile ? "flex flex-col space-y-4" : "hidden md:flex space-x-6"}>
      {navLinks.map((link) => 
        link.show ? (
          <Link
            key={link.href}
            href={link.href}
            className={`font-medium transition-colors ${
              location === link.href
                ? "text-book-brown"
                : "text-gray-700 hover:text-book-brown"
            }`}
          >
            {link.label}
          </Link>
        ) : null
      )}
    </div>
  );

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <BookOpen className="text-book-brown text-2xl mr-3" />
              <h1 className="text-2xl font-bold text-gray-800">My Library</h1>
            </Link>
            <NavLinks />
          </div>

          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="hidden sm:block relative">
              <Input
                type="text"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 rounded-full focus:ring-2 focus:ring-book-brown"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 hidden md:block">
                  {user?.email}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user?.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden md:flex space-x-2">
                <Link href="/login">
                  <Button variant="outline">Login</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col space-y-4 mt-8">
                  <NavLinks mobile />
                  {!isAuthenticated && (
                    <Link href="/login">
                      <Button className="w-full">Login</Button>
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
