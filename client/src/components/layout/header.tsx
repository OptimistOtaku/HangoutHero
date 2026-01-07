import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [location] = useLocation();
  
  return (
    <header className="bg-gradient-to-r from-amber-50 to-pink-50 shadow-md border-b-2 border-amber-200/50 relative overflow-hidden">
      {/* Scrapbook decorative elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-200/30 rotate-45 transform translate-x-8 -translate-y-8"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-pink-200/30 -rotate-12 transform -translate-x-4 translate-y-4"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center py-4">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-map-marker-alt text-white text-lg"></i>
                </div>
                {/* Scrapbook tape decoration */}
                <div className="absolute -top-1 -right-1 w-6 h-4 bg-yellow-200/90 rotate-12 shadow-sm"></div>
              </div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-text relative">
                HangoutHero
                <span className="absolute -bottom-1 left-0 right-0 h-2 bg-yellow-200/60 -z-0 transform -skew-x-12"></span>
              </h1>
            </div>
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            <a href="#" className="text-gray-700 hover:text-primary transition-colors">How it works</a>
            <a href="#" className="text-gray-700 hover:text-primary transition-colors">Inspiration</a>
            <a href="#" className="text-gray-700 hover:text-primary transition-colors">About</a>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="hidden md:block text-text font-medium hover:text-primary"
            >
              Sign In
            </Button>
            
            {location === "/" ? (
              <Button 
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-[#FF6B85]"
              >
                Get Started
              </Button>
            ) : (
              <Link href="/">
                <Button 
                  variant="outline"
                  className="border border-gray-300 hover:border-primary text-text"
                >
                  Home
                </Button>
              </Link>
            )}
            
            <Button 
              variant="ghost" 
              className="md:hidden text-gray-700 p-2"
            >
              <i className="fas fa-bars text-xl"></i>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
