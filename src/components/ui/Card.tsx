import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

import { cn } from '@/lib/utils';
import { cardVariants } from '@/lib/variants';

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  hover?: boolean;
  animate?: boolean; // Enable Framer Motion animations
  depth?: boolean; // Enable 3D depth effect on hover
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, hover, animate, depth, ...props }, ref) => {
    const isInteractive = interactive || hover;
    const useAnimation = animate && isInteractive;

    // Motion values for parallax effect
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth spring animations
    const rotateX = useSpring(useTransform(y, [-100, 100], [5, -5]), {
      stiffness: 400,
      damping: 30,
    });
    const rotateY = useSpring(useTransform(x, [-100, 100], [-5, 5]), {
      stiffness: 400,
      damping: 30,
    });

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
      if (!depth) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      x.set(event.clientX - centerX);
      y.set(event.clientY - centerY);
    };

    const handleMouseLeave = () => {
      if (!depth) return;
      x.set(0);
      y.set(0);
    };

    if (useAnimation) {
      return (
        <motion.div
          ref={ref}
          className={cn(
            cardVariants({ variant, padding, interactive: isInteractive }),
            className
          )}
          style={
            depth
              ? {
                  rotateX,
                  rotateY,
                  transformStyle: 'preserve-3d',
                }
              : undefined
          }
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          whileHover={{
            y: -4,
            scale: 1.01,
            transition: {
              type: 'spring',
              stiffness: 400,
              damping: 25,
            },
          }}
          whileTap={{
            scale: 0.98,
            transition: {
              type: 'spring',
              stiffness: 400,
              damping: 25,
            },
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
          }}
          {...props}
        />
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, padding, interactive: isInteractive }),
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-bold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

/**
 * CardGroup component for staggered animations
 * Wraps multiple Card components and animates them with a stagger effect
 */
interface CardGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  stagger?: number; // Delay between each card animation in seconds
  children: React.ReactNode;
}

const CardGroup = React.forwardRef<HTMLDivElement, CardGroupProps>(
  ({ className, stagger = 0.1, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: stagger,
          },
        },
        hidden: {},
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
);
CardGroup.displayName = 'CardGroup';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardGroup };
