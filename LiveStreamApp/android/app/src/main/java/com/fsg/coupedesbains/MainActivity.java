package com.fsg.coupedesbains;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Edge-to-edge : la WebView s'étend derrière la status bar et la nav bar
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
