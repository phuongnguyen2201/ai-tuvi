package vn.tuviapp.app;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SocialLoginPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);

        if (intent.hasExtra("GoogleSignInProvider")
            && intent.getStringExtra("GoogleSignInProvider") != null
            && intent.getStringExtra("GoogleSignInProvider").equals("GoogleProvider")) {
            Intent data = intent.getExtras().getParcelable("data");
            if (data != null) {
                super.onActivityResult(GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN, -1, data);
            }
        }
    }
}
