import { motion } from "framer-motion"

const Loader = ({ variant = "spinner", size = "md", color = "primary", text = "", className = "", ...props }) => {
  // Size configurations
  const sizes = {
    xs: { width: "16px", height: "16px", text: "text-xs" },
    sm: { width: "24px", height: "24px", text: "text-sm" },
    md: { width: "32px", height: "32px", text: "text-base" },
    lg: { width: "48px", height: "48px", text: "text-lg" },
    xl: { width: "64px", height: "64px", text: "text-xl" },
  }

  // Color configurations
  const colors = {
    primary: "text-blue-500",
    secondary: "text-gray-500",
    success: "text-green-500",
    warning: "text-yellow-500",
    danger: "text-red-500",
    white: "text-white",
  }

  const currentSize = sizes[size]
  const currentColor = colors[color]

  // Spinner Loader
  const SpinnerLoader = () => {
    const spinnerVariants = {
      animate: {
        rotate: 360,
        transition: {
          duration: 1,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        },
      },
    }

    return (
      <motion.div
        className={`inline-block border-2 border-current border-t-transparent rounded-full ${currentColor}`}
        style={{ width: currentSize.width, height: currentSize.height }}
        variants={spinnerVariants}
        animate="animate"
      />
    )
  }

  // Dots Loader
  const DotsLoader = () => {
    const dotVariants = {
      animate: {
        y: [0, -8, 0],
        transition: {
          duration: 0.6,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        },
      },
    }

    const containerVariants = {
      animate: {
        transition: {
          staggerChildren: 0.1,
        },
      },
    }

    const dotSize = Number.parseInt(currentSize.width) / 4

    return (
      <motion.div className="flex space-x-1" variants={containerVariants} animate="animate">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={`rounded-full ${currentColor} bg-current`}
            style={{ width: `${dotSize}px`, height: `${dotSize}px` }}
            variants={dotVariants}
          />
        ))}
      </motion.div>
    )
  }

  // Pulse Loader
  const PulseLoader = () => {
    const pulseVariants = {
      animate: {
        scale: [1, 1.2, 1],
        opacity: [1, 0.7, 1],
        transition: {
          duration: 1.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        },
      },
    }

    return (
      <motion.div
        className={`rounded-full ${currentColor} bg-current`}
        style={{ width: currentSize.width, height: currentSize.height }}
        variants={pulseVariants}
        animate="animate"
      />
    )
  }

  // Wave Loader
  const WaveLoader = () => {
    const waveVariants = {
      animate: {
        scaleY: [1, 2, 1],
        transition: {
          duration: 0.8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        },
      },
    }

    const containerVariants = {
      animate: {
        transition: {
          staggerChildren: 0.1,
        },
      },
    }

    const barWidth = Number.parseInt(currentSize.width) / 5
    const barHeight = Number.parseInt(currentSize.height)

    return (
      <motion.div className="flex items-end space-x-1" variants={containerVariants} animate="animate">
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={index}
            className={`${currentColor} bg-current rounded-sm`}
            style={{ width: `${barWidth}px`, height: `${barHeight / 2}px` }}
            variants={waveVariants}
          />
        ))}
      </motion.div>
    )
  }

  // Progress Loader
  const ProgressLoader = () => {
    const progressVariants = {
      animate: {
        x: ["-100%", "100%"],
        transition: {
          duration: 1.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        },
      },
    }

    return (
      <div
        className="relative bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
        style={{ width: currentSize.width, height: "4px" }}
      >
        <motion.div
          className={`absolute top-0 left-0 h-full w-1/3 ${currentColor} bg-current rounded-full`}
          variants={progressVariants}
          animate="animate"
        />
      </div>
    )
  }

  // UMT Themed Loader
  const UMTLoader = () => {
    const bookVariants = {
      animate: {
        rotateY: [0, 180, 360],
        transition: {
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        },
      },
    }

    const pageVariants = {
      animate: {
        rotateX: [0, 90, 0],
        transition: {
          duration: 1,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 0.5,
        },
      },
    }

    return (
      <div className="relative" style={{ width: currentSize.width, height: currentSize.height }}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg"
          variants={bookVariants}
          animate="animate"
        >
          <motion.div
            className="absolute top-1 left-1 right-1 h-1 bg-white/30 rounded"
            variants={pageVariants}
            animate="animate"
          />
          <motion.div
            className="absolute top-3 left-1 right-1 h-1 bg-white/20 rounded"
            variants={pageVariants}
            animate="animate"
            style={{ animationDelay: "0.1s" }}
          />
        </motion.div>
      </div>
    )
  }

  // Orbit Loader
  const OrbitLoader = () => {
    const orbitVariants = {
      animate: {
        rotate: 360,
        transition: {
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        },
      },
    }

    const planetVariants = {
      animate: {
        rotate: -360,
        transition: {
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        },
      },
    }

    const centerSize = Number.parseInt(currentSize.width) / 3
    const planetSize = Number.parseInt(currentSize.width) / 6

    return (
      <motion.div
        className="relative"
        style={{ width: currentSize.width, height: currentSize.height }}
        variants={orbitVariants}
        animate="animate"
      >
        {/* Center */}
        <div
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${currentColor} bg-current rounded-full`}
          style={{ width: `${centerSize}px`, height: `${centerSize}px` }}
        />
        {/* Orbiting planet */}
        <motion.div
          className={`absolute top-0 left-1/2 transform -translate-x-1/2 ${currentColor} bg-current rounded-full opacity-70`}
          style={{ width: `${planetSize}px`, height: `${planetSize}px` }}
          variants={planetVariants}
          animate="animate"
        />
      </motion.div>
    )
  }

  // Render appropriate loader variant
  const renderLoader = () => {
    switch (variant) {
      case "dots":
        return <DotsLoader />
      case "pulse":
        return <PulseLoader />
      case "wave":
        return <WaveLoader />
      case "progress":
        return <ProgressLoader />
      case "umt":
        return <UMTLoader />
      case "orbit":
        return <OrbitLoader />
      default:
        return <SpinnerLoader />
    }
  }

  // Container animation
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 25,
      },
    },
  }

  return (
    <motion.div
      className={`flex flex-col items-center justify-center space-y-3 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {renderLoader()}
      {text && (
        <motion.p
          className={`${currentSize.text} ${currentColor} font-medium`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  )
}

// Full Screen Loader Overlay
export const LoaderOverlay = ({ isVisible = false, variant = "umt", text = "Loading...", className = "" }) => {
  const overlayVariants = {
    hidden: {
      opacity: 0,
      backdropFilter: "blur(0px)",
    },
    visible: {
      opacity: 1,
      backdropFilter: "blur(8px)",
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      backdropFilter: "blur(0px)",
      transition: {
        duration: 0.2,
        ease: "easeIn",
      },
    },
  }

  if (!isVisible) return null

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 ${className}`}
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
        <Loader variant={variant} size="lg" text={text} />
      </div>
    </motion.div>
  )
}

// Inline Loader for buttons
export const ButtonLoader = ({ size = "sm", color = "white" }) => {
  return <Loader variant="spinner" size={size} color={color} />
}

export default Loader
