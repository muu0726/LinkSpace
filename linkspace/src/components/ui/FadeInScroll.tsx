"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FadeInScrollProps {
    children: ReactNode;
    delay?: number;
    className?: string;
}

export function FadeInScroll({ children, delay = 0, className = "" }: FadeInScrollProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
                duration: 0.6,
                delay: delay,
                ease: [0.21, 0.47, 0.32, 0.98], // easeOutQuint
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
