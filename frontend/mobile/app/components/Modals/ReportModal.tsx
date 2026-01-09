import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { createReport, REPORT_REASONS, ReportType, ReportReason } from "../../api/reportApi";
import { showToast } from "../Toast/Toast";

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  reportType: ReportType;
  itemId: string;
  itemName?: string; // Optional name for display (e.g., username, post title)
}

const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  reportType,
  itemId,
  itemName,
}) => {
  const { theme } = useTheme();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const getTitle = () => {
    switch (reportType) {
      case "post":
        return "Report Post";
      case "message":
        return "Report Message";
      case "user":
        return "Report User";
      default:
        return "Report";
    }
  };

  const getDescription = () => {
    switch (reportType) {
      case "post":
        return "Why are you reporting this post?";
      case "message":
        return "Why are you reporting this message?";
      case "user":
        return itemName ? `Why are you reporting ${itemName}?` : "Why are you reporting this user?";
      default:
        return "Why are you reporting this?";
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert("Error", "Please select a reason for reporting");
      return;
    }

    setLoading(true);
    try {
      await createReport({
        reportType,
        itemId,
        reason: selectedReason,
        description: description.trim() || undefined,
      });

      showToast({
        type: "success",
        text1: "Report Submitted",
        text2: "Thank you for helping keep our community safe",
      });

      // Reset form and close
      setSelectedReason(null);
      setDescription("");
      onClose();
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to submit report. Please try again.";
      
      if (message.includes("already reported")) {
        Alert.alert("Already Reported", "You have already reported this item.");
      } else {
        Alert.alert("Error", message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDescription("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: theme.colors.overlay,
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "85%",
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.text + "20",
            }}
          >
            <Text
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: 20,
                color: theme.colors.text,
              }}
            >
              {getTitle()}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20 }}>
            {/* Description */}
            <Text
              style={{
                fontFamily: theme.fonts.body,
                fontSize: 16,
                color: theme.colors.text + "80",
                marginBottom: 20,
              }}
            >
              {getDescription()}
            </Text>

            {/* Reason Options */}
            <View style={{ marginBottom: 20 }}>
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.value}
                  onPress={() => setSelectedReason(reason.value)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 8,
                    backgroundColor:
                      selectedReason === reason.value
                        ? theme.colors.primary + "20"
                        : theme.colors.background,
                    borderWidth: 1,
                    borderColor:
                      selectedReason === reason.value
                        ? theme.colors.primary
                        : theme.colors.text + "20",
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor:
                        selectedReason === reason.value
                          ? theme.colors.primary
                          : theme.colors.text + "40",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    {selectedReason === reason.value && (
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: theme.colors.primary,
                        }}
                      />
                    )}
                  </View>
                  <Text
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: 16,
                      color: theme.colors.text,
                    }}
                  >
                    {reason.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Additional Details */}
            <Text
              style={{
                fontFamily: theme.fonts.bodyBold,
                fontSize: 14,
                color: theme.colors.text,
                marginBottom: 8,
              }}
            >
              Additional details (optional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Provide more context about your report..."
              placeholderTextColor={theme.colors.text + "50"}
              multiline
              numberOfLines={4}
              maxLength={1000}
              style={{
                backgroundColor: theme.colors.background,
                borderRadius: 12,
                padding: 16,
                fontFamily: theme.fonts.body,
                fontSize: 14,
                color: theme.colors.text,
                textAlignVertical: "top",
                minHeight: 100,
                borderWidth: 1,
                borderColor: theme.colors.text + "20",
              }}
            />
            <Text
              style={{
                fontFamily: theme.fonts.body,
                fontSize: 12,
                color: theme.colors.text + "60",
                marginTop: 4,
                textAlign: "right",
              }}
            >
              {description.length}/1000
            </Text>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!selectedReason || loading}
              style={{
                backgroundColor:
                  !selectedReason || loading
                    ? theme.colors.text + "30"
                    : theme.colors.error,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                marginTop: 20,
                marginBottom: 40,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: 16,
                    color: "#FFFFFF",
                  }}
                >
                  Submit Report
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ReportModal;
