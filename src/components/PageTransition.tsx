import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const pageVariants = {
    initial: {
        opacity: 0,
        y: 12,
        filter: 'blur(6px)',
    },
    animate: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
            duration: 0.45,
            ease: [0.23, 1, 0.32, 1],
        },
    },
    exit: {
        opacity: 0,
        y: -8,
        filter: 'blur(4px)',
        transition: {
            duration: 0.25,
            ease: 'easeIn',
        },
    },
};

/**
 * Wrap each page route in this component for smooth transitions.
 * Add a unique background per page via the `bg` prop.
 */
export default function PageTransition({
    children,
    bg,
}: {
    children: React.ReactNode;
    bg?: 'command' | 'map' | 'ledger' | 'eco' | 'climate' | 'ai' | 'status';
}) {
    const location = useLocation();

    // Unique decorative orb positions per page
    const backgrounds: Record<string, React.ReactNode> = {
        command: (
            <>
                <div className="orb orb-cyan" style={{ width: 500, height: 500, top: -180, right: -180 }} />
                <div className="orb orb-purple" style={{ width: 350, height: 350, bottom: 100, left: -120, animationDelay: '-5s' }} />
            </>
        ),
        map: (
            <>
                <div className="orb orb-blue" style={{ width: 600, height: 600, top: -200, left: -200 }} />
                <div className="orb orb-green" style={{ width: 400, height: 400, bottom: -100, right: -100, animationDelay: '-3s' }} />
            </>
        ),
        ledger: (
            <>
                <div className="orb orb-green" style={{ width: 500, height: 500, top: -150, right: -200 }} />
                <div className="orb orb-indigo" style={{ width: 350, height: 350, bottom: 50, left: -150, animationDelay: '-6s' }} />
            </>
        ),
        eco: (
            <>
                <div className="orb orb-green" style={{ width: 550, height: 550, top: -200, left: -150 }} />
                <div className="orb orb-cyan" style={{ width: 300, height: 300, bottom: -80, right: -80, animationDelay: '-4s' }} />
                <div className="orb orb-blue" style={{ width: 200, height: 200, top: '40%', right: '10%', animationDelay: '-7s' }} />
            </>
        ),
        climate: (
            <>
                <div className="orb orb-purple" style={{ width: 600, height: 600, top: -250, left: -200 }} />
                <div className="orb orb-indigo" style={{ width: 400, height: 400, bottom: -100, right: -200, animationDelay: '-5s' }} />
                <div className="orb orb-cyan" style={{ width: 250, height: 250, top: '30%', right: '20%', animationDelay: '-2s' }} />
            </>
        ),
        ai: (
            <>
                <div className="orb orb-indigo" style={{ width: 500, height: 500, top: -150, right: -200 }} />
                <div className="orb orb-purple" style={{ width: 450, height: 450, bottom: -150, left: -150, animationDelay: '-4s' }} />
            </>
        ),
        status: (
            <>
                <div className="orb" style={{ width: 500, height: 500, top: -200, right: -200, background: 'radial-gradient(circle, #ef4444, transparent 70%)', animationDelay: '-3s' }} />
                <div className="orb orb-blue" style={{ width: 400, height: 400, bottom: -100, left: -100, animationDelay: '-6s' }} />
            </>
        ),
    };

    return (
        <div className="relative">
            {/* Per-page unique background orbs */}
            {bg && backgrounds[bg] && (
                <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                    {backgrounds[bg]}
                </div>
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={location.pathname}
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
