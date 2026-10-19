import React from 'react';
import Link from 'next/link';
import { MapPin, Truck, Tag } from 'lucide-react';

export default function TopUtilityBar() {
  return (
    <div className="w-full bg-[#F5F5F5] border-b border-[#EBEBEB] text-[12px] text-[#666666]">
      <div className="max-w-[1240px] mx-auto px-4 py-2 flex items-center justify-between">
        {/* Welcome message */}
        <div className="font-normal text-[#666666]">
          Welcome to worldwide Megamart!
        </div>

        {/* Right utility links */}
        <div className="hidden sm:flex items-center gap-5 sm:gap-7">
          <button
            type="button"
            className="flex items-center gap-1.5 hover:text-[#008ECC] transition-colors cursor-pointer"
            title="Change Delivery Location"
          >
            <MapPin className="w-3.5 h-3.5 text-[#008ECC]" />
            <span>
              Deliver to <span className="font-semibold text-[#222222]">423651</span>
            </span>
          </button>

          <Link
            href="/account?tab=orders"
            className="flex items-center gap-1.5 hover:text-[#008ECC] transition-colors"
          >
            <Truck className="w-3.5 h-3.5 text-[#008ECC]" />
            <span>Track your order</span>
          </Link>

          <Link
            href="/products?discount=true"
            className="flex items-center gap-1.5 hover:text-[#008ECC] transition-colors"
          >
            <Tag className="w-3.5 h-3.5 text-[#008ECC]" />
            <span>All Offers</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
