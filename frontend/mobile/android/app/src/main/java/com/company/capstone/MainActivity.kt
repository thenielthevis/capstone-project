package com.company.capstone

import android.os.Build
import android.os.Bundle
import android.widget.FrameLayout
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper
import expo.modules.splashscreen.SplashScreenManager
import com.unity3d.player.UnityPlayer

class MainActivity : ReactActivity() {

    // --- Unity Player ---
    private lateinit var unityPlayer: UnityPlayer

    override fun onCreate(savedInstanceState: Bundle?) {
        // Splash screen registration (Expo)
        SplashScreenManager.registerOnActivity(this)

        super.onCreate(null)

        // --- Unity Setup ---
        unityPlayer = UnityPlayer(this)
        unityPlayer.requestFocus()

        // Full-screen Unity embedding
        val layout = FrameLayout(this)
        layout.addView(unityPlayer)
        setContentView(layout)
    }

    // --- Unity Lifecycle ---
    override fun onDestroy() {
        unityPlayer.quit()
        super.onDestroy()
    }

    override fun onPause() {
        super.onPause()
        unityPlayer.pause()
    }

    override fun onResume() {
        super.onResume()
        unityPlayer.resume()
    }

    override fun onBackPressed() {
        // You can handle Unity back separately if needed
        unityPlayer.quit()
        super.onBackPressed()
    }

    // --- React Native ---
    override fun getMainComponentName(): String = "main"

    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return ReactActivityDelegateWrapper(
            this,
            BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
            object : DefaultReactActivityDelegate(
                this,
                mainComponentName,
                fabricEnabled
            ) {}
        )
    }

    override fun invokeDefaultOnBackPressed() {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
            if (!moveTaskToBack(false)) {
                super.invokeDefaultOnBackPressed()
            }
            return
        }
        super.invokeDefaultOnBackPressed()
    }
}