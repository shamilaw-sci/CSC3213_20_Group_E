import React from 'react';
import { Home as HomeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-gray-300 pt-16 pb-8 font-sans mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4 group inline-flex">
                            <div className="bg-blue-600 p-2 rounded-xl group-hover:scale-110 transition-transform">
                                <HomeIcon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-black tracking-tighter text-white">Thirasara</span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Reimagining real estate in Sri Lanka. Find your perfect home, calculate your feasibility, and seamlessly connect with top sellers.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path></svg>
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-400 hover:text-white transition-all">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path></svg>
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-700 hover:text-white transition-all">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"></path><circle cx="4" cy="4" r="2"></circle></svg>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-bold mb-6 text-lg tracking-tight">Quick Links</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/map" className="hover:text-blue-400 transition-colors">Search Map</Link></li>
                            <li><Link to="/feasibility" className="hover:text-blue-400 transition-colors">Feasibility Engine</Link></li>
                            <li><Link to="/favorites" className="hover:text-blue-400 transition-colors">Saved Homes</Link></li>
                            <li><Link to="/login" className="hover:text-blue-400 transition-colors">Sign In</Link></li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h4 className="text-white font-bold mb-6 text-lg tracking-tight">Services</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/add-property" className="hover:text-blue-400 transition-colors">Sell a Home</Link></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Rentals</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Mortgage Calculator</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Real Estate Agents</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-bold mb-6 text-lg tracking-tight">Contact Us</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-3">
                                <div className="mt-1 w-5 h-5 flex items-center justify-center rounded bg-gray-800 text-blue-400">📍</div>
                                <span>123 Reid Avenue,<br/>Colombo 07, Sri Lanka</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-5 h-5 flex items-center justify-center rounded bg-gray-800 text-blue-400">📞</div>
                                <span>+94 11 234 5678</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-5 h-5 flex items-center justify-center rounded bg-gray-800 text-blue-400">✉️</div>
                                <span>hello@thirasara.lk</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} Thirasara Property Group. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-white transition-colors">Cookie Settings</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
